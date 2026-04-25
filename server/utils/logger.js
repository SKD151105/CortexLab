const LEVELS = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3
};

const resolveLevel = () => {
	const configured = (process.env.LOG_LEVEL || '').toLowerCase();
	if (configured && Object.prototype.hasOwnProperty.call(LEVELS, configured)) {
		return configured;
	}

	return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
};

const ACTIVE_LEVEL = resolveLevel();

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const redact = (value) => {
	if (Array.isArray(value)) {
		return value.map(redact);
	}

	if (!isObject(value)) {
		return value;
	}

	const out = {};
	for (const [key, val] of Object.entries(value)) {
		const lower = key.toLowerCase();
		if (lower.includes('token') || lower.includes('password') || lower.includes('apikey') || lower.includes('authorization')) {
			out[key] = '[REDACTED]';
			continue;
		}
		out[key] = redact(val);
	}
	return out;
};

const shouldLog = (level) => LEVELS[level] <= LEVELS[ACTIVE_LEVEL];

const formatMeta = (meta) => {
	if (!meta || (isObject(meta) && Object.keys(meta).length === 0)) {
		return '';
	}

	try {
		return ` ${JSON.stringify(redact(meta))}`;
	} catch {
		return ' {"meta":"[Unserializable]"}';
	}
};

const requestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createLogger = (scope = 'app', staticMeta = {}) => {
	const logWithLevel = (level, message, meta = {}) => {
		if (!shouldLog(level)) {
			return;
		}

		const line = `${new Date().toISOString()} ${level.toUpperCase()} [${scope}] ${message}${formatMeta({ ...staticMeta, ...meta })}`;
		if (level === 'error') {
			console.error(line);
			return;
		}
		if (level === 'warn') {
			console.warn(line);
			return;
		}
		console.log(line);
	};

	return {
		error: (message, meta) => logWithLevel('error', message, meta),
		warn: (message, meta) => logWithLevel('warn', message, meta),
		info: (message, meta) => logWithLevel('info', message, meta),
		debug: (message, meta) => logWithLevel('debug', message, meta),
		child: (childScope, meta = {}) => createLogger(`${scope}.${childScope}`, { ...staticMeta, ...meta }),
		timer: (name, meta = {}) => {
			const startedAt = process.hrtime.bigint();
			logWithLevel('debug', `${name}:start`, meta);
			return {
				end: (extra = {}) => {
					const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
					logWithLevel('info', `${name}:end`, {
						...meta,
						...extra,
						durationMs: Number(durationMs.toFixed(2))
					});
					return durationMs;
				}
			};
		}
	};
};

export const createRequestLogger = (scope, req) => {
	const reqMeta = {
		requestId: req.headers['x-request-id'] || requestId(),
		method: req.method,
		path: req.originalUrl,
		userId: req.user?._id?.toString?.() || 'anonymous'
	};
	return createLogger(scope, reqMeta);
};
