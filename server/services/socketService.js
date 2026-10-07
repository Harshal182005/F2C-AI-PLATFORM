let io;

export const initializeSocket = (socketIO) => {
    io = socketIO;
};

export const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.IO has not been initialized."
        );
    }

    return io;
};

export const emitOrderStatusUpdate = (
    orderId,
    order
) => {
    const socketIO = getIO();

    socketIO
        .to(`order_${orderId}`)
        .emit(
            "orderStatusUpdated",
            order
        );
};