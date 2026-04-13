#!/usr/bin/env python3
"""Dark theme polish for CRM pages."""

def process(path):
    with open(path, 'r') as f:
        text = f.read()
    orig = text

    def r(old, new, cnt=-1):
        nonlocal text
        text = text.replace(old, new, cnt)

    # ===== OUTER CONTAINER =====
    if 'max-w-[1600px] mx-auto' in text:
        r('<div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">',
          '<div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }} className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">')
    if 'p-6 lg:p-8 space-y-6 h-full flex flex-col' in text:
        r('<div className="p-6 lg:p-8 space-y-6 h-full flex flex-col">',
          '<div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }} className="p-6 lg:p-8 space-y-6 h-full flex flex-col">')
    if 'min-h-full p-4 md:p-6 space-y-6' in text:
        r('<div className="min-h-full p-4 md:p-6 space-y-6">',
          '<div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }} className="min-h-full p-4 md:p-6 space-y-6">')

    # ===== CARDS =====
    r('<Card className="border-0 shadow-sm">',
      '<Card style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }} className="border-0 shadow-sm">')
    r('<Card className="border-0 shadow-sm h-full">',
      '<Card style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }} className="border-0 shadow-sm h-full">')
    r('<Card\n                  className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4"\n                  style={{ borderLeftColor:',
      '<Card\n                  style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A", borderLeftColor:')

    # ===== PROPOSAL CARDS =====
    r('"bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer transition-all group"',
      '"rounded-lg p-4 shadow-sm border border-[#2A2A2A] cursor-pointer transition-all group"')

    # ===== STATS CARDS =====
    r('"bg-white rounded-lg p-4 shadow-sm border border-gray-100"',
      '"rounded-lg p-4 shadow-sm border border-[#2A2A2A]"')

    # ===== BRANDED INVOICE PREVIEW =====
    r('className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"',
      'className="bg-white rounded-lg shadow-sm border border-[#2A2A2A] overflow-hidden"')

    # ===== CALENDAR =====
    r('className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500 uppercase"',
      'style={{ color: "#A0A0A0", backgroundColor: "#141414" }} className="py-2 text-center text-xs font-semibold uppercase"')
    r('bg-gray-200 border border-gray-200', 'border border-[#2A2A2A]')
    r('border-x border-b border-gray-200', 'border-x border-b border-[#2A2A2A]')
    r('className="bg-white min-h-[100px] md:min-h-[120px]"',
      'style={{ backgroundColor: "#1A1A1A" }} className="min-h-[100px] md:min-h-[120px]"')
    r("className={`bg-white min-h-[100px] md:min-h-[120px] p-1.5 text-left transition-colors hover:bg-yellow-50/50",
      "className={`min-h-[100px] md:min-h-[120px] p-1.5 text-left transition-colors hover:bg-[#F3D840]/10")
    r(": 'text-gray-700'", ": 'text-[#E0E0E0]'")
    r('text-[#F3D840] bg-white rounded-full shadow-sm',
      'text-[#F3D840] bg-[#1A1A1A] rounded-full shadow-sm')

    # ===== HEADINGS text-gray-900 -> white =====
    r('className="text-xl font-bold text-gray-900"',
      'style={{ color: "#FFFFFF" }} className="text-xl font-bold"')
    r('className="text-sm font-semibold text-gray-900"',
      'style={{ color: "#FFFFFF" }} className="text-sm font-semibold"')
    r('className="text-sm font-medium text-gray-900 truncate"',
      'style={{ color: "#FFFFFF" }} className="text-sm font-medium truncate"')
    r('className="font-semibold text-gray-900 truncate"',
      'style={{ color: "#FFFFFF" }} className="font-semibold truncate"')
    r('className="font-medium text-sm text-gray-900"',
      'style={{ color: "#FFFFFF" }} className="font-medium text-sm"')
    r('className="font-medium text-gray-900"',
      'style={{ color: "#FFFFFF" }} className="font-medium"')
    r('text-sm font-bold text-gray-900',
      'text-sm font-bold" style={{ color: "#FFFFFF" }}')
    r('className="text-sm font-semibold text-gray-700 flex items-center gap-2"',
      'style={{ color: "#A0A0A0" }} className="text-sm font-semibold flex items-center gap-2"')
    r('className="text-lg leading-tight">{meeting.title}</CardTitle>',
      'className="text-lg leading-tight" style={{ color: "#FFFFFF" }}>{meeting.title}</CardTitle>')
    r('<CardTitle className="text-base">{formatFullDate(',
      '<CardTitle className="text-base" style={{ color: "#FFFFFF" }}>{formatFullDate(')

    # Section headings
    r('text-sm font-semibold text-gray-900 mb-4">Status Timeline',
      'text-sm font-semibold mb-4" style={{ color: "#FFFFFF" }}>Status Timeline')
    r('text-sm font-semibold text-gray-900 mb-3">Line Items',
      'text-sm font-semibold mb-3" style={{ color: "#FFFFFF" }}>Line Items')
    r('text-sm font-semibold text-gray-900 mb-2">Notes',
      'text-sm font-semibold mb-2" style={{ color: "#FFFFFF" }}>Notes')
    r('text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Payment History',
      'text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#FFFFFF" }}>Payment History')

    # Detail panel text
    r('<p className="font-medium text-gray-900">{formatFullDate(meeting.date)}</p>',
      '<p style={{ color: "#FFFFFF" }} className="font-medium">{formatFullDate(meeting.date)}</p>')
    r('<p className="font-medium text-gray-900">{meeting.contact.firstName}',
      '<p style={{ color: "#FFFFFF" }} className="font-medium">{meeting.contact.firstName}')
    r('<p className="font-medium text-gray-900">{meeting.deal.title}</p>',
      '<p style={{ color: "#FFFFFF" }} className="font-medium">{meeting.deal.title}</p>')

    # ===== SECONDARY TEXT =====
    r('text-gray-500', 'text-[#A0A0A0]')
    r('text-gray-600', 'text-[#A0A0A0]')
    r('text-gray-700', 'text-[#A0A0A0]')

    # ===== MUTED TEXT =====
    r('text-gray-400', 'text-[#666666]')
    r('text-gray-300', 'text-[#666666]')

    # ===== BACKGROUNDS =====
    r('bg-gray-50 rounded-lg', 'rounded-lg')
    r('className="bg-gray-50"', 'className="bg-[#141414]"')
    r('bg-gray-50/', '')
    r(' bg-gray-50 ', ' ')
    r('bg-gray-100', 'bg-[#1A1A1A]')
    r('bg-gray-200', 'bg-[#222222]')

    # ===== BORDERS =====
    r('border-gray-100', 'border-[#2A2A2A]')
    r('border-gray-200', 'border-[#2A2A2A]')
    r('border-gray-300', 'border-[#2A2A2A]')
    r('border-dashed border-blue-200', 'border-dashed border-blue-500/30')

    # ===== HOVER STATES =====
    r('hover:bg-gray-50', 'hover:bg-white/5')
    r('hover:bg-gray-100', 'hover:bg-white/5')
    r('hover:bg-red-50', 'hover:bg-red-500/10')
    r('hover:bg-amber-50', 'hover:bg-amber-500/10')
    r('hover:bg-green-50', 'hover:bg-green-500/10')
    r('hover:bg-blue-50', 'hover:bg-blue-500/10')
    r('hover:bg-yellow-50/50', 'hover:bg-[#F3D840]/10')
    r('bg-blue-50/50', 'bg-blue-500/10')

    # ===== bg-white cleanup =====
    r('bg-white rounded-md border', 'rounded-md border')
    r('border-t bg-white p-4', 'border-t p-4')
    r('border-t bg-white', 'border-t')

    # ===== TABS =====
    r("'text-gray-500 hover:bg-gray-100'",
      "'text-[#A0A0A0] hover:bg-white/5'")

    # ===== SheetContent =====
    r('<SheetContent side="right" className="sm:max-w-xl p-0 w-full">',
      '<SheetContent side="right" style={{ backgroundColor: "#1A1A1A" }} className="sm:max-w-xl p-0 w-full">')
    r('<SheetContent side="right" className="sm:max-w-lg p-0 w-full">',
      '<SheetContent side="right" style={{ backgroundColor: "#1A1A1A" }} className="sm:max-w-lg p-0 w-full">')
    r('<SheetContent className="w-full sm:max-w-xl overflow-hidden">',
      '<SheetContent style={{ backgroundColor: "#1A1A1A" }} className="w-full sm:max-w-xl overflow-hidden">')

    # ===== EMPTY STATES =====
    r('className="text-center py-12 text-gray-500"',
      'style={{ color: "#666666" }} className="text-center py-12"')
    r('className="h-12 w-12 mx-auto mb-3 text-gray-300"',
      'className="h-12 w-12 mx-auto mb-3 text-[#666666]"')

    # ===== DESCRIPTION LABELS =====
    r('className="font-medium text-gray-700 mb-1">Description',
      'className="font-medium mb-1" style={{ color: "#A0A0A0" }}>Description')
    r('className="font-medium text-gray-700 mb-1">Notes',
      'className="font-medium mb-1" style={{ color: "#A0A0A0" }}>Notes')
    r('className="font-medium text-gray-700 mb-1">Follow-up Task',
      'className="font-medium mb-1" style={{ color: "#A0A0A0" }}>Follow-up Task')

    # ===== KANBAN =====
    r('"bg-gray-50 rounded-xl p-4 min-h-[200px]"',
      '"rounded-xl p-4 min-h-[200px]"')

    # ===== PAYMENT HISTORY =====
    r('bg-green-50 rounded-lg', 'rounded-lg')

    # ===== STATUS CONFIG =====
    r("cancelled: { label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-100' }",
      "cancelled: { label: 'Cancelled', color: 'text-[#A0A0A0]', bg: 'bg-[#1A1A1A]' }")
    r("draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileText },",
      "draft: { label: 'Draft', color: 'text-[#A0A0A0]', bgColor: 'bg-[#1A1A1A]', icon: FileText },")
    r("draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },",
      "draft: { label: 'Draft', color: 'text-[#A0A0A0]', bgColor: 'bg-[#1A1A1A]' },")
    r("cancelled: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100' },",
      "cancelled: { label: 'Cancelled', color: 'text-[#A0A0A0]', bgColor: 'bg-[#1A1A1A]' },")

    # Follow-up badge
    r("bg-gray-100'} ${STATUS_CONFIG",
      "bg-[#1A1A1A]'} ${STATUS_CONFIG")
    r("|| 'text-gray-600'}",
      "|| 'text-[#A0A0A0]'}")

    # Status timeline
    r("'bg-gray-100 text-gray-400'",
      "'bg-[#1A1A1A] text-[#666666]'")
    r("bg-gray-300", "bg-[#2A2A2A]")
    r("'text-gray-900' : 'text-gray-400'",
      "'text-[#FFFFFF]' : 'text-[#666666]'")

    # ===== TOTAL LABELS =====
    r('className="font-semibold text-gray-700">Total Amount',
      'className="font-semibold text-[#A0A0A0]">Total Amount')
    r('className="font-semibold text-gray-700 text-right"',
      'className="font-semibold text-[#A0A0A0] text-right"')
    r('className="font-semibold text-gray-700">Total',
      'className="font-semibold text-[#A0A0A0]">Total')

    # ===== TABLE HEADERS =====
    r('<tr className="bg-gray-50"><th className="text-left text-[10px] uppercase',
      '<tr style={{ backgroundColor: "#141414" }}><th className="text-left text-[10px] uppercase')
    r('<tr className="bg-gray-50">\n                        <th className="text-left',
      '<tr style={{ backgroundColor: "#141414" }}>\n                        <th className="text-left')

    # Table borders
    r('border-t border-gray-50', 'border-t border-[#2A2A2A]')

    # Day detail panel button
    r('className="w-full text-left p-2.5 rounded-lg border hover:shadow-sm',
      'style={{ color: "#FFFFFF" }} className="w-full text-left p-2.5 rounded-lg border hover:shadow-sm"')

    # Meeting type button
    r("border-gray-200 text-gray-500 hover:bg-gray-50",
      "border-[#2A2A2A] text-[#A0A0A0] hover:bg-white/5")

    # Upcoming sidebar
    r('className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors"',
      'style={{ color: "#FFFFFF" }} className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 transition-colors"')

    # GripVertical
    r('text-gray-300 shrink-0', 'text-[#444444] shrink-0')

    # Cancel button text
    r('className="text-gray-600">\n          Cancel',
      'className="text-[#A0A0A0]">\n          Cancel')
    r('className="text-gray-600">\n              <Edit3',
      'className="text-[#A0A0A0]">\n              <Edit3')

    if text != orig:
        with open(path, 'w') as f:
            f.write(text)
        print(f'CHANGED: {path}')
    else:
        print(f'NO CHANGES: {path}')

process('/home/z/my-project/src/app/crm/meetings/page.tsx')
process('/home/z/my-project/src/app/crm/proposals/page.tsx')
process('/home/z/my-project/src/app/crm/invoices/page.tsx')
