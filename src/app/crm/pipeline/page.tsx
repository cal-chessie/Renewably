'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface Deal {
  id: string
  title: string
  value: number
  probability: number
  contact?: { id: string; firstName: string; lastName: string } | null
  assignee?: { id: string; name: string; avatar: string | null } | null
  stageId: string
}

interface Stage {
  id: string
  name: string
  order: number
  color: string
  deals: Deal[]
}

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  return (
    <div
      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 transition-shadow hover:shadow-md ${
        isDragging ? 'shadow-lg rotate-2 opacity-90' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">
          {deal.title}
        </h4>
        <GripVertical className="h-4 w-4 text-gray-300 shrink-0 cursor-grab" />
      </div>
      <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.value)}</p>
      <div className="flex items-center justify-between mt-2">
        {deal.contact && (
          <span className="text-xs text-gray-500">
            {deal.contact.firstName} {deal.contact.lastName}
          </span>
        )}
        <span className="text-xs text-gray-400">{deal.probability}%</span>
      </div>
      {deal.assignee && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-[#F3D840] text-[#895A18] text-[10px]">
              {deal.assignee.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-400">{deal.assignee.name}</span>
        </div>
      )}
    </div>
  )
}

function SortableDealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  )
}

export default function PipelinePage() {
  const queryClient = useQueryClient()
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newDeal, setNewDeal] = useState({
    title: '',
    value: '',
    stageId: '',
    contactId: '',
    probability: '50',
    description: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => fetch('/api/crm/pipeline').then((r) => r.json()),
    refetchInterval: 5000,
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-mini'],
    queryFn: () => fetch('/api/crm/contacts?limit=100').then((r) => r.json()),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const res = await fetch('/api/crm/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stageId }),
      })
      if (!res.ok) throw new Error('Failed to move deal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
    onError: () => toast.error('Failed to move deal'),
  })

  const createDealMutation = useMutation({
    mutationFn: async (deal: Record<string, string>) => {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deal,
          value: parseFloat(deal.value) || 0,
          probability: parseInt(deal.probability) || 50,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create deal')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      setDialogOpen(false)
      setNewDeal({ title: '', value: '', stageId: '', contactId: '', probability: '50', description: '' })
      toast.success('Deal created')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleDragStart = (event: DragStartEvent) => {
    const allDeals = data?.stages?.flatMap((s: Stage) => s.deals) || []
    const deal = allDeals.find((d: Deal) => d.id === event.active.id)
    setActiveDeal(deal || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const allStages = data?.stages || []
    const allDeals = allStages.flatMap((s: Stage) => s.deals)
    const draggedDeal = allDeals.find((d: Deal) => d.id === active.id)
    if (!draggedDeal) return

    // Find target stage
    let targetStageId = draggedDeal.stageId
    for (const stage of allStages) {
      if (stage.deals.some((d: Deal) => d.id === over.id)) {
        targetStageId = stage.id
        break
      }
      if (stage.id === over.id) {
        targetStageId = stage.id
        break
      }
    }

    if (targetStageId !== draggedDeal.stageId) {
      updateStageMutation.mutate({ dealId: draggedDeal.id, stageId: targetStageId })
    }
  }

  const stages: Stage[] = data?.stages || []

  return (
    <div className="p-6 lg:p-8 space-y-6 h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500 text-sm mt-1">
            Drag and drop deals between stages
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#895A18] hover:bg-[#6B4510] text-white font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Deal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value (€)</Label>
                  <Input
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Probability (%)</Label>
                  <Input
                    type="number"
                    value={newDeal.probability}
                    onChange={(e) => setNewDeal({ ...newDeal, probability: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stage *</Label>
                <Select
                  value={newDeal.stageId}
                  onValueChange={(v) => setNewDeal({ ...newDeal, stageId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage: Stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={newDeal.contactId}
                  onValueChange={(v) => setNewDeal({ ...newDeal, contactId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactsData?.contacts?.map((c: Record<string, unknown>) => (
                      <SelectItem key={c.id as string} value={c.id as string}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                />
              </div>
              <Button
                onClick={() => {
                  if (!newDeal.title || !newDeal.stageId) {
                    toast.error('Title and stage are required')
                    return
                  }
                  createDealMutation.mutate(newDeal)
                }}
                disabled={createDealMutation.isPending}
                className="w-full bg-[#895A18] hover:bg-[#6B4510] text-white"
              >
                {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-96" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {stages.map((stage: Stage, index: number) => (
              <motion.div
                key={stage.id}
                id={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col bg-gray-100/80 rounded-xl min-h-[200px]"
              >
                {/* Stage Header */}
                <div
                  className="px-3 py-2.5 rounded-t-xl"
                  style={{ backgroundColor: stage.color + '15' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {stage.name}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {stage.deals.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {formatCurrency(stage.deals.reduce((sum: number, d: Deal) => sum + d.value, 0))}
                  </p>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                  <SortableContext
                    items={stage.deals.map((d: Deal) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stage.deals.map((deal: Deal) => (
                      <SortableDealCard key={deal.id} deal={deal} />
                    ))}
                  </SortableContext>
                  {stage.deals.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                      No deals
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
