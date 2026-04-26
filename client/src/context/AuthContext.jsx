/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(() => {
		try {
			const userStr = localStorage.getItem('user');
			return userStr ? JSON.parse(userStr) : null;
		} catch {
			return null;
		}
	});
	const [loading, setLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(() => {
		const token = localStorage.getItem('token');
		const userStr = localStorage.getItem('user');
		return Boolean(token && userStr);
	});

	const login = (userData, accessToken, refreshToken) => {
		localStorage.setItem('token', accessToken);
		if (refreshToken) {
			localStorage.setItem('refreshToken', refreshToken);
		}
		localStorage.setItem('user', JSON.stringify(userData));

		setUser(userData);
		setIsAuthenticated(true);
	};

	const logout = useCallback(() => {
		const currentRefreshToken = localStorage.getItem('refreshToken');

		if (currentRefreshToken) {
			authService.logout(currentRefreshToken).catch(() => {
				// Ignore network/logout API failures, local session is cleared regardless.
			});
		}

		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('user');

		setUser(null);
		setIsAuthenticated(false);
		window.location.href = '/';
	}, []);

	const updateUser = (updatedUserData) => {
		const newUserData = { ...user, ...updatedUserData };
		localStorage.setItem('user', JSON.stringify(newUserData));
		setUser(newUserData);
	};

	const checkAuthStatus = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			const refreshToken = localStorage.getItem('refreshToken');
			const userStr = localStorage.getItem('user');

			if (token && userStr) {
				const userData = JSON.parse(userStr);
				setUser(userData);
				setIsAuthenticated(true);
			} else if (refreshToken) {
				const response = await authService.refreshToken(refreshToken);
				const nextAccessToken = response.accessToken || response.token;
				const nextRefreshToken = response.refreshToken;
				const userData = response.user || response.data?.user;

				if (!nextAccessToken || !nextRefreshToken || !userData) {
					throw new Error('Invalid refresh response');
				}

				localStorage.setItem('token', nextAccessToken);
				localStorage.setItem('refreshToken', nextRefreshToken);
				localStorage.setItem('user', JSON.stringify(userData));
				setUser(userData);
				setIsAuthenticated(true);
			} else {
				setUser(null);
				setIsAuthenticated(false);
			}
		} catch (error) {
			console.error('Auth check failed:', error);
			logout();
		} finally {
			setLoading(false);
		}
	}, [logout]);

	useEffect(() => {
		checkAuthStatus();
	}, [checkAuthStatus]);

	const value = {
		user,
		loading,
		isAuthenticated,
		login,
		logout,
		updateUser,
		checkAuthStatus
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
