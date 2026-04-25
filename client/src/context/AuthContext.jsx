/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";

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

	const login = (userData, token) => {
		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(userData));

		setUser(userData);
		setIsAuthenticated(true);
	};

	const logout = useCallback(() => {
		localStorage.removeItem('token');
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
			const userStr = localStorage.getItem('user');

			if (token && userStr) {
				const userData = JSON.parse(userStr);
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
