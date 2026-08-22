import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    price: Number,
    quantity: Number,
    reason: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['defective', 'wrong_item', 'not_as_described', 'shipping_damage', 'changed_mind', 'other']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cod'],
    required: true
  },
  paymentRefundId: {
    type: String,
    comment: 'Stripe refund ID or PayPal refund ID'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  completedAt: Date,
  attachments: [{
    url: String,
    filename: String,
    uploadedAt: Date
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  resolutionNote: String,
  statusHistory: [{
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
refundSchema.index({ order: 1 });
refundSchema.index({ user: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamps
refundSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.approvedBy,
      note: this.adminNotes || `Status changed to ${this.status}`,
      updatedAt: new Date()
    });

    if (this.status === 'approved') {
      this.approvedAt = new Date();
    }
    if (this.status === 'completed') {
      this.completedAt = new Date();
      this.isResolved = true;
      this.resolvedAt = new Date();
    }
    if (this.status === 'rejected') {
      this.isResolved = true;
      this.resolvedAt = new Date();
      this.resolutionNote = this.rejectionReason;
    }
  }
  next();
});

export default mongoose.model('Refund', refundSchema);