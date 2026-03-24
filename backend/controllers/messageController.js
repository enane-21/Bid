const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
    try {
        const message = await Message.create({
            ...req.body,
            sender: req.user.id
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email role')
            .populate('recipient', 'name email role');

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllMessages = async (req, res) => {
    try {
        // Get both sent and received messages
        const messages = await Message.find({
            $or: [
                { sender: req.user.id },
                { recipient: req.user.id }
            ]
        })
            .populate('sender', 'name email role')
            .populate('recipient', 'name email role')
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getReceivedMessages = async (req, res) => {
    try {
        const messages = await Message.find({ recipient: req.user.id })
            .populate('sender', 'name email role')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: messages.length, messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSentMessages = async (req, res) => {
    try {
        const messages = await Message.find({ sender: req.user.id })
            .populate('recipient', 'name email role')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: messages.length, messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        message.isRead = true;
        await message.save();

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only sender or recipient can delete
        if (message.sender.toString() !== req.user.id && message.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await message.deleteOne();
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
