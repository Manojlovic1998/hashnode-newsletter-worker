export const isAllowedOrigin = (reqOrigin: string, allowedOrigins: Array<string>) => {
	return allowedOrigins.includes(reqOrigin);
};
