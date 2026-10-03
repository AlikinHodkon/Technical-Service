const requestsBody = document.getElementById('requestsBody');
const filtersForm = document.getElementById('filtersForm');
const requestForm = document.getElementById('requestForm');
const loginForm = document.getElementById('loginForm');
const authStatus = document.getElementById('authStatus');
const errorBox = document.getElementById('error');

// Токен держим только в памяти (не localStorage): localStorage читается
// универсально, по известному ключу, любым скриптом на странице и переживает
// перезагрузку — то есть это первое, что проверит XSS-полезная нагрузка или
// вредоносное расширение браузера. Переменная в памяти не даёт абсолютной
// неуязвимости к XSS (внедрённый скрипт в том же документе теоретически
// может его перехватить в момент использования), но заметно сужает окно
// и убирает самый дешёвый вектор кражи. type="module" на этом файле (см.
// index.html) не даёт другим classic-скриптам на странице достать эту
// переменную просто по имени.
let accessToken = null;

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
	if (!accessToken) return;

	const params = new FormData(filtersForm);
	const query = new URLSearchParams({ limit: '100' });
	for (const [key, value] of params.entries()) {
		if (value) query.set(key, value);
	}

	try {
		const response = await fetch(`/api/requests?${query}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
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

loginForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	showError('');

	const formData = new FormData(loginForm);
	try {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: formData.get('email'),
				password: formData.get('password'),
			}),
		});
		const body = await response.json();
		if (!response.ok)
			throw new Error(body.title ?? `Ошибка: ${response.status}`);

		accessToken = body.accessToken;
		authStatus.innerText = `Вы вошли как ${body.user.email} (${body.user.role})`;
		await loadRequests();
	} catch (err) {
		showError(err.message);
	}
});

requestForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	showError('');

	const formData = new FormData(requestForm);
	const plannedAt = formData.get('plannedAt');
	const payload = {
		equipmentId: formData.get('equipmentId'),
		title: formData.get('title'),
		author: formData.get('author'),
		description: formData.get('description') || undefined,
		priority: formData.get('priority'),
		plannedAt: plannedAt ? new Date(plannedAt).toISOString() : undefined,
	};

	try {
		const response = await fetch('/api/requests', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
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
