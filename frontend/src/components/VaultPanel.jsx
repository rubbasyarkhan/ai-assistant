import React from 'react';
import { FolderOpen, FileText, FileSpreadsheet, FileCode, File, RefreshCw } from 'lucide-react';

export default function VaultPanel({ files, onRefresh }) {
  
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'docx' || ext === 'doc') {
      return <FileText className="text-blue-400" size={16} />;
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileSpreadsheet className="text-green-400" size={16} />;
    } else if (ext === 'pdf') {
      return <File className="text-red-400" size={16} />;
    } else if (['py', 'js', 'html', 'css', 'json', 'sh', 'bat'].includes(ext)) {
      return <FileCode className="text-orange-400" size={16} />;
    }
    return <File className="text-gray-400" size={16} />;
  };

  const formatSize = (bytes) => {
    if (bytes === undefined || bytes === null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="hud-panel vault-panel">
      <div className="panel-header">
        <FolderOpen size={18} className="text-cyan" />
        <span className="panel-title">WORKSPACE VAULT</span>
        <button onClick={onRefresh} className="btn-icon text-cyan" title="Sync Vault">
          <RefreshCw size={14} className="hover-spin" />
        </button>
      </div>

      <div className="panel-content files-list-container">
        {files.length === 0 ? (
          <div className="empty-state text-cyan">
            NO_WORKSPACE_DOCS_FOUND
          </div>
        ) : (
          <div className="files-table">
            <div className="files-table-header">
              <span>FILE_NAME</span>
              <span className="text-right">SIZE</span>
            </div>
            <div className="files-table-body">
              {files.map((file, index) => (
                <div key={index} className="file-row">
                  <div className="file-name-col">
                    {getFileIcon(file.name)}
                    <span className="file-name" title={file.name}>{file.name}</span>
                  </div>
                  <div className="file-size-col text-right">
                    {formatSize(file.size)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
