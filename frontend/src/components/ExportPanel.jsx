import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Download, FileText, FileSpreadsheet, Loader2, 
  CheckCircle, XCircle, History
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExportPanel = () => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(null);
  const [status, setStatus] = useState(null);

  const handleExport = async (type, format) => {
    setExporting(`${type}-${format}`);
    setStatus(null);
    
    try {
      const endpoint = format === 'csv' 
        ? `${API}/export/${type}/csv` 
        : `${API}/export/${type}/pdf`;
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setStatus({ type: 'success', message: `${format.toUpperCase()} downloaded!` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'trades',
      title: t('export.downloadHistory'),
      icon: History,
      description: 'All executed trades with P&L',
      formats: ['csv', 'pdf']
    },
    {
      id: 'alerts',
      title: t('alerts.title'),
      icon: FileText,
      description: 'All price alerts history',
      formats: ['csv']
    }
  ];

  return (
    <GlassCard title={t('common.export')} icon="📥" accent="teal" data-testid="export-panel">
      <div className="space-y-4">
        {exportOptions.map((option) => (
          <div 
            key={option.id}
            className="p-4 rounded-xl bg-black/30 border border-white/10"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <option.icon className="text-teal-400" size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white">{option.title}</h4>
                <p className="text-xs text-slate-500">{option.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {option.formats.includes('csv') && (
                <NeonButton
                  onClick={() => handleExport(option.id, 'csv')}
                  variant="white"
                  size="sm"
                  disabled={exporting !== null}
                  data-testid={`export-${option.id}-csv`}
                >
                  {exporting === `${option.id}-csv` ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={14} />
                  )}
                  {t('export.exportCSV')}
                </NeonButton>
              )}
              
              {option.formats.includes('pdf') && (
                <NeonButton
                  onClick={() => handleExport(option.id, 'pdf')}
                  variant="teal"
                  size="sm"
                  disabled={exporting !== null}
                  data-testid={`export-${option.id}-pdf`}
                >
                  {exporting === `${option.id}-pdf` ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileText size={14} />
                  )}
                  {t('export.exportPDF')}
                </NeonButton>
              )}
            </div>
          </div>
        ))}

        {/* Status Message */}
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-3 rounded-lg ${
              status.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span className="text-sm">{status.message}</span>
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
};

export default ExportPanel;
