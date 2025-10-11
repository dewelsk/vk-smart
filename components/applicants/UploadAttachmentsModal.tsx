'use client'

import { useEffect, useMemo, useState, ChangeEvent } from 'react'
import { toast } from 'react-hot-toast'

type CandidateOption = {
  id: string
  vk: {
    id: string
    identifier: string
  }
}

type CandidateAttachmentType = 'cv' | 'motivation' | 'certificate' | 'other'

type PendingFile = {
  file: File
  documentType: CandidateAttachmentType
}

type UploadAttachmentsModalProps = {
  open: boolean
  onClose: () => void
  candidates: Array<{
    id: string
    vk: {
      id: string
      identifier: string
    }
  }>
  onUploaded: () => void | Promise<void>
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: CandidateAttachmentType; label: string }> = [
  { value: 'cv', label: 'Životopis (CV)' },
  { value: 'motivation', label: 'Motivačný list' },
  { value: 'certificate', label: 'Certifikát' },
  { value: 'other', label: 'Iná príloha' },
]

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export default function UploadAttachmentsModal({ open, onClose, candidates, onUploaded }: UploadAttachmentsModalProps) {
  const candidateOptions: CandidateOption[] = useMemo(
    () => candidates.map(candidate => ({ id: candidate.id, vk: candidate.vk })),
    [candidates]
  )

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [defaultDocumentType, setDefaultDocumentType] = useState<CandidateAttachmentType>('cv')
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [isUploading, setUploading] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedCandidateId(candidateOptions[0]?.id ?? null)
      setPendingFiles([])
      setDefaultDocumentType('cv')
      setUploading(false)
    }
  }, [open, candidateOptions])

  if (!open) {
    return null
  }

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const mapped = Array.from(files).map(file => ({
      file,
      documentType: defaultDocumentType,
    }))

    setPendingFiles(prev => [...prev, ...mapped])
    event.target.value = ''
  }

  const handlePendingFileTypeChange = (index: number, type: CandidateAttachmentType) => {
    setPendingFiles(prev => prev.map((item, current) => (current === index ? { ...item, documentType: type } : item)))
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, current) => current !== index))
  }

  const handleUpload = async () => {
    if (!selectedCandidateId) {
      toast.error('Vyberte uchádzača a výberové konanie')
      return
    }

    if (pendingFiles.length === 0) {
      toast.error('Vyberte súbory na nahratie')
      return
    }

    const candidate = candidateOptions.find(item => item.id === selectedCandidateId)
    if (!candidate) {
      toast.error('Nie je možné identifikovať kandidáta')
      return
    }

    setUploading(true)
    toast.loading('Nahrávam súbory...')

    try {
      const formData = new FormData()
      formData.append('vkId', candidate.vk.id)

      pendingFiles.forEach(({ file, documentType }) => {
        formData.append('files', file)
        formData.append('documentTypes', documentType)
      })

      const response = await fetch(`/api/admin/candidates/${selectedCandidateId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      toast.dismiss()

      if (!response.ok) {
        toast.error(data.error || 'Súbory sa nepodarilo nahrať')
        return
      }

      toast.success('Súbory boli nahrané')
      await onUploaded()
    } catch (error) {
      console.error('Admin upload error:', error)
      toast.dismiss()
      toast.error('Súbory sa nepodarilo nahrať')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (isUploading) {
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nahrať súbory</h2>
            <p className="text-sm text-gray-600">Vyberte výberové konanie uchádzača a nahrajte požadované dokumenty.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Zatvoriť"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-gray-700">
              Výberové konanie
              <select
                value={selectedCandidateId ?? ''}
                onChange={event => setSelectedCandidateId(event.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {candidateOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.vk.identifier}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-gray-700">
              Predvolený typ dokumentu
              <select
                value={defaultDocumentType}
                onChange={event => setDefaultDocumentType(event.target.value as CandidateAttachmentType)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {DOCUMENT_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-gray-700">
            Súbory na nahratie
            <input
              type="file"
              multiple
              onChange={handleFileSelection}
              accept=".pdf,.doc,.docx,.docm,.txt,.zip"
              className="block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              data-testid="modal-file-input"
            />
            <span className="text-xs text-gray-500">Podporované formáty: PDF, DOCX, DOC, TXT, ZIP (max. 25 MB na súbor)</span>
          </label>

          {pendingFiles.length > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4" data-testid="modal-pending-files">
              <h3 className="text-sm font-semibold text-blue-900">Vybrané súbory</h3>
              <ul className="mt-3 space-y-3 text-sm">
                {pendingFiles.map((item, index) => (
                  <li key={`${item.file.name}-${index}`} className="rounded-md bg-white p-3 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.file.name}</p>
                        <p className="text-xs text-gray-500">{formatBytes(item.file.size)}</p>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                        <label className="text-xs text-gray-600 md:flex md:items-center md:gap-2">
                          Typ:
                          <select
                            value={item.documentType}
                            onChange={event => handlePendingFileTypeChange(index, event.target.value as CandidateAttachmentType)}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            {DOCUMENT_TYPE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemovePendingFile(index)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Odstrániť
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Zrušiť
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || pendingFiles.length === 0 || !selectedCandidateId}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${
              isUploading || pendingFiles.length === 0 || !selectedCandidateId
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
            }`}
            data-testid="modal-upload-button"
          >
            {isUploading ? 'Nahrávam...' : 'Nahrať súbory'}
          </button>
        </div>
      </div>
    </div>
  )
}
