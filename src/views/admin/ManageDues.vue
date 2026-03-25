<script setup>
import { computed, onMounted, ref } from 'vue'
import { duesAPI } from '@/lib/api'
import { useToast } from '@/composables/useToast'
import {
  buildAdminMonthOptions,
  DUES_MONTHLY_AMOUNT,
  DUES_START_MONTH,
  formatMonthLabel,
  getNextDueMonth,
  normalizeMonthKey,
} from '@/lib/dues'

const { showToast } = useToast()

const members = ref([])
const payments = ref([])
const selectedMemberId = ref('')
const selectedMonths = ref([])
const loading = ref(false)
const saving = ref(false)

const adminMonthOptions = buildAdminMonthOptions()

const paymentsByMember = computed(() => {
  return payments.value.reduce((acc, payment) => {
    const monthKey = normalizeMonthKey(payment.dues_month)

    if (!monthKey) return acc

    if (!acc[payment.member_id]) {
      acc[payment.member_id] = new Set()
    }

    acc[payment.member_id].add(monthKey)
    return acc
  }, {})
})

const selectedMember = computed(() => {
  return members.value.find((member) => member.id === selectedMemberId.value) || null
})

const selectedMemberPaidMonths = computed(() => {
  return paymentsByMember.value[selectedMemberId.value] || new Set()
})

const memberRows = computed(() => {
  return members.value.map((member) => {
    const paidMonths = paymentsByMember.value[member.id] || new Set()

    return {
      ...member,
      displayName: getMemberName(member),
      paidCount: paidMonths.size,
      nextDueMonth: getNextDueMonth([...paidMonths], DUES_START_MONTH),
    }
  })
})

function getMemberName(member) {
  return member.full_name || member.email || member.id
}

function isMonthPaid(memberId, monthKey) {
  return paymentsByMember.value[memberId]?.has(monthKey) || false
}

function isBatchMonthSelected(monthKey) {
  return selectedMonths.value.includes(monthKey)
}

function toggleBatchMonth(monthKey) {
  if (isBatchMonthSelected(monthKey)) {
    selectedMonths.value = selectedMonths.value.filter((value) => value !== monthKey)
    return
  }

  selectedMonths.value = [...selectedMonths.value, monthKey]
}

function selectMember(memberId) {
  selectedMemberId.value = memberId
  selectedMonths.value = []
}

async function loadData() {
  loading.value = true

  try {
    const [{ data: membersData }, { data: paymentsData }] = await Promise.all([
      duesAPI.getDuesMembers(),
      duesAPI.getAllPayments(),
    ])

    members.value = [...(membersData || [])].sort((a, b) =>
      getMemberName(a).localeCompare(getMemberName(b)),
    )
    payments.value = paymentsData || []

    if (!members.value.some((member) => member.id === selectedMemberId.value)) {
      selectedMemberId.value = members.value[0]?.id || ''
      selectedMonths.value = []
    }
  } catch (error) {
    console.error('Error loading dues data:', error)
    showToast('Failed to load dues data', 'error')
  } finally {
    loading.value = false
  }
}

async function markSelectedMonthsPaid() {
  if (!selectedMember.value || selectedMonths.value.length === 0) {
    showToast('Choose a member and at least one month', 'error')
    return
  }

  saving.value = true

  try {
    await duesAPI.markMonthsPaid(selectedMember.value.id, selectedMonths.value)
    showToast('Months marked as paid', 'success')
    selectedMonths.value = []
    await loadData()
  } catch (error) {
    console.error('Error saving dues payments:', error)
    showToast('Failed to save dues payments', 'error')
  } finally {
    saving.value = false
  }
}

async function toggleMonthPayment(member, monthKey) {
  const monthIsPaid = isMonthPaid(member.id, monthKey)
  const actionLabel = monthIsPaid ? 'remove' : 'mark'

  if (monthIsPaid && !confirm(`Remove ${formatMonthLabel(monthKey)} as paid for ${getMemberName(member)}?`)) {
    return
  }

  saving.value = true

  try {
    if (monthIsPaid) {
      await duesAPI.removeMonthPayment(member.id, monthKey)
      showToast(`${formatMonthLabel(monthKey)} marked unpaid`, 'success')
    } else {
      await duesAPI.markMonthsPaid(member.id, [monthKey])
      showToast(`${formatMonthLabel(monthKey)} marked paid`, 'success')
    }

    await loadData()
  } catch (error) {
    console.error(`Error trying to ${actionLabel} dues payment:`, error)
    showToast('Failed to update dues month', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="manage-dues">
    <h1>Manage Member Dues</h1>
    <p class="page-copy">
      Dues are ${{ DUES_MONTHLY_AMOUNT }}/month and the tracked schedule starts in
      {{ formatMonthLabel(DUES_START_MONTH) }}.
    </p>

    <div v-if="loading" class="loading-state">Loading dues roster...</div>

    <div v-else-if="members.length === 0" class="empty-state">
      No dues members found yet. Mark member profiles with <code>is_dues_member = true</code> to
      add them here.
    </div>

    <template v-else>
      <div class="dues-layout">
        <section class="member-list-card">
          <div class="section-header">
            <h2>Dues Members</h2>
            <span>{{ members.length }} members</span>
          </div>

          <div class="member-list">
            <button
              v-for="member in memberRows"
              :key="member.id"
              type="button"
              class="member-row"
              :class="{ active: selectedMemberId === member.id }"
              @click="selectMember(member.id)"
            >
              <div>
                <strong>{{ member.displayName }}</strong>
                <p>{{ member.email || 'No email on profile' }}</p>
              </div>
              <div class="member-meta">
                <span>{{ member.paidCount }} paid</span>
                <span>{{ member.nextDueMonth ? formatMonthLabel(member.nextDueMonth) : 'Paid ahead' }}</span>
              </div>
            </button>
          </div>
        </section>

        <section v-if="selectedMember" class="bulk-editor-card">
          <div class="section-header">
            <div>
              <h2>Batch Mark Paid</h2>
              <p>{{ getMemberName(selectedMember) }}</p>
            </div>
            <button
              type="button"
              class="btn-primary"
              :disabled="saving || selectedMonths.length === 0"
              @click="markSelectedMonthsPaid"
            >
              {{ saving ? 'Saving...' : `Mark ${selectedMonths.length} Month${selectedMonths.length === 1 ? '' : 's'} Paid` }}
            </button>
          </div>

          <div class="month-picker-grid">
            <button
              v-for="monthKey in adminMonthOptions"
              :key="monthKey"
              type="button"
              class="month-chip"
              :class="{
                selected: isBatchMonthSelected(monthKey),
                paid: selectedMemberPaidMonths.has(monthKey),
              }"
              @click="toggleBatchMonth(monthKey)"
            >
              <span>{{ formatMonthLabel(monthKey) }}</span>
              <small>{{ selectedMemberPaidMonths.has(monthKey) ? 'Already paid' : 'Select' }}</small>
            </button>
          </div>
        </section>
      </div>

      <section class="dues-matrix-card">
        <div class="section-header">
          <div>
            <h2>All Members View</h2>
            <p>Click a cell to mark a month paid or correct it back to unpaid.</p>
          </div>
        </div>

        <div class="matrix-scroll">
          <table class="dues-matrix">
            <thead>
              <tr>
                <th>Member</th>
                <th v-for="monthKey in adminMonthOptions" :key="monthKey">
                  {{ formatMonthLabel(monthKey) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in memberRows" :key="member.id">
                <th>{{ member.displayName }}</th>
                <td v-for="monthKey in adminMonthOptions" :key="`${member.id}-${monthKey}`">
                  <button
                    type="button"
                    class="matrix-cell"
                    :class="{ paid: isMonthPaid(member.id, monthKey) }"
                    :disabled="saving"
                    @click="toggleMonthPayment(member, monthKey)"
                  >
                    {{ isMonthPaid(member.id, monthKey) ? 'Paid' : 'Open' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.manage-dues {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.page-copy {
  color: #5f6c7b;
  margin-bottom: 2rem;
}

.loading-state,
.empty-state {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #5f6c7b;
}

.dues-layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.member-list-card,
.bulk-editor-card,
.dues-matrix-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.section-header h2 {
  color: #2c3e50;
  margin-bottom: 0.3rem;
}

.section-header p,
.section-header span {
  color: #6b7785;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 520px;
  overflow-y: auto;
}

.member-row {
  width: 100%;
  text-align: left;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.member-row.active {
  border-color: var(--color-purple);
  background: #f6effc;
}

.member-row strong {
  display: block;
  color: #243447;
  margin-bottom: 0.25rem;
}

.member-row p {
  color: #6b7785;
  font-size: 0.9rem;
}

.member-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #52606d;
}

.btn-primary {
  border: none;
  border-radius: 8px;
  background: var(--color-purple);
  color: white;
  padding: 0.85rem 1.15rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.month-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.month-chip {
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  background: #fff;
  padding: 0.85rem;
  text-align: left;
  cursor: pointer;
  color: #243447;
}

.month-chip.selected {
  border-color: var(--color-purple);
  background: #f6effc;
}

.month-chip.paid {
  background: #eef8f1;
  border-color: #bfe1c9;
}

.month-chip span,
.month-chip small {
  display: block;
}

.month-chip small {
  margin-top: 0.35rem;
  color: #6b7785;
}

.matrix-scroll {
  overflow-x: auto;
}

.dues-matrix {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

.dues-matrix th,
.dues-matrix td {
  padding: 0.75rem;
  border-bottom: 1px solid #e8ecf1;
  text-align: center;
  vertical-align: middle;
}

.dues-matrix thead th {
  color: #4c5a67;
  font-size: 0.85rem;
  white-space: nowrap;
}

.dues-matrix tbody th {
  text-align: left;
  white-space: nowrap;
  color: #243447;
}

.matrix-cell {
  min-width: 72px;
  border: 1px solid #d9e2ec;
  border-radius: 999px;
  background: #fff;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  color: #52606d;
}

.matrix-cell.paid {
  background: #1f9d55;
  border-color: #1f9d55;
  color: white;
}

.matrix-cell:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 960px) {
  .dues-layout {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
  }

  .btn-primary {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .manage-dues {
    padding: 1rem;
  }

  .member-row {
    flex-direction: column;
  }

  .member-meta {
    align-items: flex-start;
  }
}
</style>
