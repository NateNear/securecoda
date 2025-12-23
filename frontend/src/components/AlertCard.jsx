import React from 'react';
import '../index.css';

function AlertCard({ alert, onFix }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="alert-card">
      <div className="alert-content">
        <div className="alert-header">
          <span className="alert-type">{alert.type}</span>
          <span className={`alert-severity severity-${alert.severity || 5}`}>
            Severity: {alert.severity || 5}
          </span>
        </div>
        <span className="alert-message">{alert.message}</span>
        
        {alert.metadata && (
          <div className="alert-metadata">
            {alert.metadata.createdAt && (
              <div className="metadata-item">
                <span className="label">Created:</span>
                <span className="value">{formatDate(alert.metadata.createdAt)}</span>
              </div>
            )}
            {alert.metadata.updatedAt && (
              <div className="metadata-item">
                <span className="label">Last Updated:</span>
                <span className="value">{formatDate(alert.metadata.updatedAt)}</span>
              </div>
            )}
            {alert.metadata.lastModifiedDaysAgo && (
              <div className="metadata-item">
                <span className="label">Days Unused:</span>
                <span className="value">{alert.metadata.lastModifiedDaysAgo}</span>
              </div>
            )}
            {alert.metadata.externalEmail && (
              <div className="metadata-item">
                <span className="label">Shared With:</span>
                <span className="value">{alert.metadata.externalEmail}</span>
              </div>
            )}
            {alert.metadata.ageInDays && (
              <div className="metadata-item">
                <span className="label">Document Age:</span>
                <span className="value">{alert.metadata.ageInDays} days</span>
              </div>
            )}
          </div>
        )}
      </div>
      <button className="fix-button" onClick={() => onFix(alert.docId || alert.rowId)}>
        Fix
      </button>
    </div>
  );
}

export default AlertCard;
