import React, { useState } from "react";
import {
  X,
  CreditCard,
  IndianRupee,
  Calendar,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Modal, Button, Input } from "../../ui";
import { ProjectStageWithDays, PaymentStatus } from "../../../types";

interface PaymentReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: ProjectStageWithDays | null;
  onConfirmPayment: (data: PaymentData) => void;
}

export interface PaymentData {
  stageId: string;
  paymentStatus: PaymentStatus;
  actualAmount: number;
  paymentDate: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  paymentNotes?: string;
}

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  isOpen,
  onClose,
  stage,
  onConfirmPayment,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    PaymentStatus.PAID
  );
  const [actualAmount, setActualAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  if (!stage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onConfirmPayment({
      stageId: stage.id,
      paymentStatus,
      actualAmount: parseFloat(actualAmount),
      paymentDate,
      invoiceNumber: invoiceNumber || undefined,
      invoiceUrl: invoiceUrl || undefined,
      paymentNotes: paymentNotes || undefined,
    });

    // Reset form
    setActualAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setInvoiceNumber("");
    setInvoiceUrl("");
    setPaymentNotes("");
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // TODO: Implement actual file upload to your storage service
    // For now, just simulate upload
    setTimeout(() => {
      setInvoiceUrl(`/uploads/invoices/${file.name}`);
      setIsUploading(false);
    }, 1000);
  };

  const isOverdue = stage.paymentDueDate && new Date(stage.paymentDueDate) < new Date();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                isOverdue ? "bg-red-100" : "bg-orange-100"
              }`}>
                <CreditCard className={`w-7 h-7 ${
                  isOverdue ? "text-red-600" : "text-orange-600"
                }`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Payment Collection</h3>
                <p className="text-sm text-gray-600 mt-1">{stage.phaseName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {/* Payment Summary Box */}
          <div className={`p-5 rounded-xl border-2 mb-6 ${
            isOverdue 
              ? "bg-red-50 border-red-200" 
              : stage.paymentStatus === PaymentStatus.PARTIAL
              ? "bg-orange-50 border-orange-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-start gap-3">
              {isOverdue ? (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Payment Details</span>
                  <span className={`text-2xl font-bold ${
                    isOverdue ? "text-red-700" : "text-gray-900"
                  }`}>
                    ₹{stage.paymentAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Current Status:</span>
                    <span className={`font-semibold px-2.5 py-1 rounded-full text-xs ${
                      stage.paymentStatus === PaymentStatus.PAID
                        ? "bg-emerald-100 text-emerald-700"
                        : stage.paymentStatus === PaymentStatus.PARTIAL
                        ? "bg-orange-100 text-orange-700"
                        : isOverdue
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {stage.paymentStatus}
                    </span>
                  </div>
                  {stage.paymentDueDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Due Date:</span>
                      <span className={`font-semibold ${
                        isOverdue ? "text-red-600" : "text-gray-700"
                      }`}>
                        {new Date(stage.paymentDueDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
                {isOverdue && (
                  <div className="mt-3 px-3 py-2 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Payment is overdue! This stage cannot progress until payment is collected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Payment Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Status
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentStatus(PaymentStatus.PAID)}
                  className={`p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
                    paymentStatus === PaymentStatus.PAID
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus(PaymentStatus.PARTIAL)}
                  className={`p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
                    paymentStatus === PaymentStatus.PARTIAL
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Partial
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus(PaymentStatus.COLLECTED)}
                  className={`p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
                    paymentStatus === PaymentStatus.COLLECTED
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Collected
                </button>
              </div>
            </div>

            {/* Amount Received */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount Received <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <Input
                  type="number"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder={`Expected: ₹${stage.paymentAmount?.toLocaleString()}`}
                  className="pl-11 h-12 text-base"
                  required onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
                />
              </div>
              {actualAmount && parseFloat(actualAmount) !== stage.paymentAmount && (
                <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Amount differs from expected payment</span>
                </div>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="pl-11 h-12 text-base"
                  required
                />
              </div>
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Invoice Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <Input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2024-001"
                  className="pl-11 h-12 text-base" onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
                />
              </div>
            </div>

            {/* Invoice Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Invoice
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-orange-400 hover:bg-orange-50/30 transition-all">
                <input
                  type="file"
                  id="invoice-upload"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <label
                  htmlFor="invoice-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center shadow-sm">
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">
                      {invoiceUrl ? (
                        <span className="text-emerald-600 flex items-center gap-2 justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                          File uploaded successfully
                        </span>
                      ) : (
                        "Click to upload invoice"
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (Max 5MB)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Notes
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any additional notes about this payment..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12 font-semibold">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirm Payment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};
