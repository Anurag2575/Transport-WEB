// Transport WEB - Main JavaScript
// Organized functions for UI interactions

const BID_STATUSES = ['pending', 'loading', 'in-transit', 'on-halt', 'unloading', 'completed', 'cancelled'];

function toggleMobileNav() {
  const navMenu = document.querySelector('.nav-menu');
  navMenu.classList.toggle('open');
}

// Format status label: 'in-progress' -> 'In Progress'
function formatStatusLabel(status) {
  return status.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
}

// Update bid status via AJAX
async function updateBidStatus(bidId, status) {
  const label = formatStatusLabel(status);
  if (!confirm(`Update status to ${label}?`)) return;
  
  try {
    const response = await fetch(`/bids/my-bids/${bidId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    
    if (data.success) {
      const statusEl = document.getElementById(`status-${bidId}`);
      const newClass = `status-${data.status.replace('_', '-')}`;
      statusEl.innerHTML = `<span class="metric-label">Status</span><span class="load-status-chip ${newClass}">${formatStatusLabel(data.status)}</span>`;
      document.querySelector(`#status-select-${bidId}`).value = data.status;
      alert('Status updated successfully!');
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Initialize dropdown for bid status change
function initBidStatusDropdown(bidId, currentStatus) {
  const select = document.getElementById(`status-select-${bidId}`);
  const button = document.getElementById(`status-btn-${bidId}`);
  if (!select || !button) return;
  
  select.addEventListener('change', (e) => {
    button.dataset.status = e.target.value;
    button.textContent = `Update to: ${formatStatusLabel(e.target.value)}`;
  });
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Init all bid dropdowns
  document.querySelectorAll('[id^=status-select-]').forEach((select, index) => {
    const bidId = select.id.replace('status-select-', '');
    initBidStatusDropdown(bidId, select.value);
  });
});
