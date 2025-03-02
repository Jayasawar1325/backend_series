const asyncHandler = (requestHandler) => {
    return (req, res, next) => {  // Return a new function that Express can use as middleware
        Promise.resolve(requestHandler(req, res, next)) // Resolve the handler function
            .catch((err) => next(err)); // Catch errors and pass them to Express error handler
    };
};

export { asyncHandler };
