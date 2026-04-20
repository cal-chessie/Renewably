'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportButtonProps {
  queryParams: string
  selectedIds?: string[]
}

export function ExportButton({ queryParams, selectedIds }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams(queryParams)
      if (selectedIds && selectedIds.length > 0) {
        params.set('ids', selectedIds.join(','))
      }

      const res = await fetch(`/api/crm/installers/export?${params.toString()}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `installers-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Export downloaded successfully')
    } catch {
      toast.error('Failed to export installers')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 8,
        border: '1px solid #2A2A2A',
        backgroundColor: '#222222',
        color: '#D1D5DB',
        fontSize: 13,
        fontWeight: 500,
        cursor: exporting ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { if (!exporting) { e.currentTarget.style.borderColor = 'rgba(243,216,64,0.3)'; e.currentTarget.style.color = '#F3D840' } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#D1D5DB' }}
    >
      {exporting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Download style={{ width: 14, height: 14 }} />}
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}
