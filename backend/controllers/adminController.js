const User        = require('../models/User');
const Pack        = require('../models/Pack');
const Transaction = require('../models/Transaction');
const { sendEmail } = require('../utils/mailer');

// ── STATS GLOBALES ────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTransactions, packs] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      Transaction.countDocuments({ status: 'approved' }),
      Pack.find().select('name salesCount totalRevenue currency'),
    ]);

    const revenueData = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]);

    const totalRevenue = packs.reduce((acc, p) => acc + p.totalRevenue, 0);

    // Nouveaux utilisateurs (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({
      role: 'client',
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      totalUsers,
      totalTransactions,
      totalRevenue,
      newUsersThisWeek,
      packs,
      revenueByMonth: revenueData,
    });
  } catch (err) {
    next(err);
  }
};

// ── LISTE DES CLIENTS ─────────────────────────────────────────────────────────
exports.getClients = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const query = { role: 'client' };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const [clients, total] = await Promise.all([
      User.find(query)
        .populate('purchases.packId', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v'),
      User.countDocuments(query),
    ]);

    res.json({
      clients,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── DONNER ACCÈS MANUEL À UN PACK ─────────────────────────────────────────────
exports.grantAccess = async (req, res, next) => {
  try {
    const { userId, packId } = req.body;

    const [user, pack] = await Promise.all([
      User.findById(userId),
      Pack.findById(packId),
    ]);

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    if (user.hasPurchased(packId)) {
      return res.status(409).json({ error: 'L\'utilisateur a déjà accès à ce pack.' });
    }

    user.purchases.push({
      packId,
      grantedManually: true,
      grantedBy: req.user._id,
      amount: 0,
    });
    await user.save({ validateBeforeSave: false });

    // Notifier l'utilisateur
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    await sendEmail({
      to: user.email,
      subject: `🎁 Accès offert — ${pack.name}`,
      template: 'accessGranted',
      data: {
        firstName: user.firstName,
        packName: pack.name,
        dashboardUrl,
        grantedBy: `${req.user.firstName} ${req.user.lastName}`,
      },
    });

    res.json({
      message: `Accès au pack "${pack.name}" accordé à ${user.email}.`,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// ── RÉVOQUER L'ACCÈS ──────────────────────────────────────────────────────────
exports.revokeAccess = async (req, res, next) => {
  try {
    const { userId, packId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const before = user.purchases.length;
    user.purchases = user.purchases.filter(p => p.packId.toString() !== packId.toString());

    if (user.purchases.length === before) {
      return res.status(404).json({ error: 'L\'utilisateur n\'a pas accès à ce pack.' });
    }

    await user.save({ validateBeforeSave: false });
    res.json({ message: 'Accès révoqué.' });
  } catch (err) {
    next(err);
  }
};

// ── ACTIVER / DÉSACTIVER UN COMPTE ────────────────────────────────────────────
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Impossible de modifier un admin.' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ message: `Compte ${user.isActive ? 'activé' : 'désactivé'}.`, isActive: user.isActive });
  } catch (err) {
    next(err);
  }
};

// ── LISTE DES TRANSACTIONS ────────────────────────────────────────────────────
exports.getTransactions = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate('userId', 'email firstName lastName')
        .populate('packId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(),
    ]);

    res.json({
      transactions,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (err) {
    next(err);
  }
};
