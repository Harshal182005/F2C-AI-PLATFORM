const errorMiddleware = (err, req, res, next) => {
    console.error("SERVER ERROR:", err);

    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error"
    });
};

export default errorMiddleware;