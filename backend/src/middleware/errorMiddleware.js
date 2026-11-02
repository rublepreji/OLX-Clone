
function notFound(req, res, next) {
    const error = new Error(`Route not found: ${req.originalUrl}`);

    error.statusCode = 404;
    error.code = "ROUTE_NOT_FOUND";

    next(error);
}

function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,

        message:
            statusCode === 500
                ? "Internal server error"
                : err.message,

        error: {
            code: err.code || "SERVER_ERROR",
        },
    });
}

export { notFound, errorHandler };
