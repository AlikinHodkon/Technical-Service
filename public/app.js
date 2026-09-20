const requestsBody = document.getElementById('requestsBody');
const filtersForm = document.getElementById('filtersForm');
const requestForm = document.getElementById('requestForm');
const errorBox = document.getElementById('error');

const addCell = (text, row) => {
	const td = document.createElement('td');
	td.innerText = text ?? '';
	row.appendChild(td);
};

const renderRequests = (items) => {
	requestsBody.innerHTML = '';
	for (const item of items) {
		const row = document.createElement('tr');
		addCell(item.title, row);
		addCell(item.equipmentId, row);
		addCell(item.priority, row);
		addCell(item.status, row);
		addCell(
			item.plannedAt ? item.plannedAt.slice(0, 16).replace('T', ' ') : '—',
			row,
		);
		requestsBody.appendChild(row);
	}
};

const showError = (message) => {
	errorBox.innerText = message;
};

const loadRequests = async () => {
	showError('');
	const params = new FormData(filtersForm);
	const query = new URLSearchParams({ limit: '100' });
	for (const [key, value] of params.entries()) {
		if (value) query.set(key, value);
	}

	try {
		const response = await fetch(`/api/requests?${query}`);
		if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
		const body = await response.json();
		renderRequests(body.data);
	} catch (err) {
		showError(err.message);
	}
};

filtersForm.addEventListener('submit', (event) => {
	event.preventDefault();
	loadRequests();
});

requestForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	showError('');

	const formData = new FormData(requestForm);
	const plannedAt = formData.get('plannedAt');
	const payload = {
		equipmentId: formData.get('equipmentId'),
		title: formData.get('title'),
		description: formData.get('description') || undefined,
		priority: formData.get('priority'),
		plannedAt: plannedAt ? new Date(plannedAt).toISOString() : undefined,
	};

	try {
		const response = await fetch('/api/requests', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': formData.get('apiKey'),
			},
			body: JSON.stringify(payload),
		});
		const body = await response.json();
		if (!response.ok)
			throw new Error(body.title ?? `Ошибка: ${response.status}`);

		requestForm.reset();
		await loadRequests();
	} catch (err) {
		showError(err.message);
	}
});

loadRequests();
