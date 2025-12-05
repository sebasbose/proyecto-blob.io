const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const { protect } = require('../middleware/auth');

// @desc    Obtener lista de amigos
// @route   GET /api/friends
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const friendships = await Friendship.find({
            $or: [{ requester: req.user._id }, { recipient: req.user._id }],
            status: 'accepted'
        }).populate('requester recipient', 'username avatar level stats.maxScore lastActive');

        const friends = friendships.map(f => {
            const friend = f.requester._id.toString() === req.user._id.toString() ? f.recipient : f.requester;
            return {
                _id: friend._id,
                username: friend.username,
                avatar: friend.avatar,
                level: friend.level,
                maxScore: friend.stats.maxScore,
                lastActive: friend.lastActive,
                friendSince: f.createdAt
            };
        });

        res.json(friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Enviar solicitud de amistad
// @route   POST /api/friends/request
// @access  Private
router.post('/request', protect, async (req, res) => {
    const { username } = req.body;

    try {
        const recipient = await User.findOne({ username });

        if (!recipient) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (recipient._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'No puedes enviarte solicitud a ti mismo' });
        }

        const existingFriendship = await Friendship.findOne({
            $or: [
                { requester: req.user._id, recipient: recipient._id },
                { requester: recipient._id, recipient: req.user._id }
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({ message: 'Ya son amigos' });
            }
            if (existingFriendship.status === 'pending') {
                return res.status(400).json({ message: 'Ya existe una solicitud pendiente' });
            }
        }

        const friendship = await Friendship.create({
            requester: req.user._id,
            recipient: recipient._id,
            status: 'pending'
        });

        res.status(201).json({ message: 'Solicitud enviada', friendship });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Aceptar solicitud de amistad
// @route   PUT /api/friends/accept/:id
// @access  Private
router.put('/accept/:id', protect, async (req, res) => {
    try {
        const friendship = await Friendship.findById(req.params.id);

        if (!friendship) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        if (friendship.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        friendship.status = 'accepted';
        await friendship.save();

        res.json({ message: 'Solicitud aceptada', friendship });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener solicitudes pendientes
// @route   GET /api/friends/requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
    try {
        const requests = await Friendship.find({
            recipient: req.user._id,
            status: 'pending'
        }).populate('requester', 'username avatar level stats.maxScore');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Rechazar solicitud de amistad
// @route   DELETE /api/friends/reject/:id
// @access  Private
router.delete('/reject/:id', protect, async (req, res) => {
    try {
        const friendship = await Friendship.findById(req.params.id);

        if (!friendship) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        if (friendship.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        await Friendship.findByIdAndDelete(req.params.id);

        res.json({ message: 'Solicitud rechazada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Eliminar amigo
// @route   DELETE /api/friends/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const friendship = await Friendship.findOne({
            $or: [
                { requester: req.user._id, recipient: req.params.id },
                { requester: req.params.id, recipient: req.user._id }
            ],
            status: 'accepted'
        });

        if (!friendship) {
            return res.status(404).json({ message: 'Amistad no encontrada' });
        }

        await Friendship.findByIdAndDelete(friendship._id);

        res.json({ message: 'Amigo eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Buscar usuarios
// @route   GET /api/friends/search?q=query
// @access  Private
router.get('/search', protect, async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query || query.length < 2) {
            return res.status(400).json({ message: 'La búsqueda debe tener al menos 2 caracteres' });
        }

        // Buscar usuarios que coincidan con el query
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id } // Excluir al usuario actual
        })
        .select('username avatar level stats.maxScore')
        .limit(20);

        // Obtener amistades existentes para marcar estado
        const friendships = await Friendship.find({
            $or: [
                { requester: req.user._id },
                { recipient: req.user._id }
            ]
        });

        // Crear un mapa de estados de amistad
        const friendshipMap = new Map();
        friendships.forEach(f => {
            const otherId = f.requester.toString() === req.user._id.toString() 
                ? f.recipient.toString() 
                : f.requester.toString();
            friendshipMap.set(otherId, {
                status: f.status,
                isRequester: f.requester.toString() === req.user._id.toString()
            });
        });

        // Agregar información de estado a cada usuario
        const usersWithStatus = users.map(user => {
            const userObj = user.toObject();
            const friendship = friendshipMap.get(user._id.toString());
            
            if (friendship) {
                if (friendship.status === 'accepted') {
                    userObj.friendshipStatus = 'friends';
                } else if (friendship.status === 'pending') {
                    userObj.friendshipStatus = friendship.isRequester ? 'requested' : 'pending';
                }
            } else {
                userObj.friendshipStatus = 'none';
            }
            
            return userObj;
        });

        res.json(usersWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener solicitudes enviadas
// @route   GET /api/friends/requests/sent
// @access  Private
router.get('/requests/sent', protect, async (req, res) => {
    try {
        const requests = await Friendship.find({
            requester: req.user._id,
            status: 'pending'
        }).populate('recipient', 'username avatar level stats.maxScore');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cancelar solicitud enviada
// @route   DELETE /api/friends/requests/cancel/:id
// @access  Private
router.delete('/requests/cancel/:id', protect, async (req, res) => {
    try {
        const friendship = await Friendship.findById(req.params.id);

        if (!friendship) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        if (friendship.requester.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        if (friendship.status !== 'pending') {
            return res.status(400).json({ message: 'Solo puedes cancelar solicitudes pendientes' });
        }

        await Friendship.findByIdAndDelete(req.params.id);

        res.json({ message: 'Solicitud cancelada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
