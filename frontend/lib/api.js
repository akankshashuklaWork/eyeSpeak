const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function selectCategory(category, patientId = 'demo-patient') {
  const res = await fetch(`${BACKEND_URL}/api/category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, patientId }),
  });
  if (!res.ok) throw new Error('Failed to reach eyeSpeak backend');
  return res.json();
}

export async function searchCaregiverInfo(query) {
  const res = await fetch(`${BACKEND_URL}/api/caregiver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to reach eyeSpeak backend');
  return res.json();
}
