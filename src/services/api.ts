const API_BASE_URL = 'http://localhost:3000/api';
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}
export async function getSchools() {
  const response = await fetch(`${API_BASE_URL}/schools`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch schools');
  const data = await response.json();
  return data.schools;
}
export async function getAvailableMonths(school_id: string | number, year: string | number) {
  const response = await fetch(`${API_BASE_URL}/get_available_months`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ school_id, year })
  });
  if (!response.ok) throw new Error('Failed to fetch months');
  return await response.json();
}
export async function searchEquipment(term: string) {
  const response = await fetch(`${API_BASE_URL}/get_equipment?term=${encodeURIComponent(term)}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to search equipment');
  return await response.json();
}
export async function getAllEquipmentsForSchool(school_id: string | number, year: string | number) {
  const response = await fetch(`${API_BASE_URL}/get_all_equipments_for_school`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ school_id, year })
  });
  if (!response.ok) throw new Error('Failed to fetch school equipment');
  return await response.json();
}

export async function autosaveStock(data: any) {
  const response = await fetch(`${API_BASE_URL}/autosave-stock`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to autosave stock');
  return await response.json();
}

// 📦 GET EQUIPMENT ORDERS
export async function getEquipmentOrders() {
  const response = await fetch(`${API_BASE_URL}/equipment-orders`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch equipment orders');
  return await response.json();
}

// 📦 ADD EQUIPMENT ORDER
export async function addEquipmentOrder(data: { school_id: string | number, items: any[], image?: File | null }) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('school_id', String(data.school_id));
  formData.append('items', JSON.stringify(data.items));
  if (data.image) formData.append('image', data.image);

  const response = await fetch(`${API_BASE_URL}/equipment-orders`, {
    method: 'POST',
    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
    body: formData
  });
  if (!response.ok) throw new Error('Failed to add equipment order');
  return await response.json();
}

// 📦 UPDATE EQUIPMENT ORDER STATUS
export async function updateEquipmentOrderStatus(id: number, status: string) {
  const response = await fetch(`${API_BASE_URL}/equipment-orders/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update order status');
  return await response.json();
}

// 📄 GET STOCK REPORTSappr
export async function getStockReports(month?: string | number, date?: string) {
  const params = new URLSearchParams();
  if (month) params.append('month', String(month));
  if (date) params.append('date', date);

  const response = await fetch(`${API_BASE_URL}/stock-reports?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch stock reports');
  return await response.json();
}

// 📄 ADD STOCK REPORT
export async function addStockReport(data: { school_id: string | number, report_date: string, file_main: File }) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('school_id', String(data.school_id));
  formData.append('report_date', data.report_date);
  formData.append('file_main', data.file_main);

  const response = await fetch(`${API_BASE_URL}/stock-reports`, {
    method: 'POST',
    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
    body: formData
  });
  if (!response.ok) throw new Error('Failed to add stock report');
  return await response.json();
}
