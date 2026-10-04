import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'https://localhost';
const VUS = Number(__ENV.VUS || 20);
const DURATION = __ENV.DURATION || '40s';

export const options = {
	insecureSkipTLSVerify: true, // самоподписанный сертификат nginx
	scenarios: {
		read_mix: {
			executor: 'ramping-vus',
			startVUs: 0,
			stages: [
				{ duration: '10s', target: VUS },
				{ duration: DURATION, target: VUS },
				{ duration: '10s', target: 0 },
			],
		},
	},
};

export function setup() {
	const loginRes = http.post(
		`${BASE_URL}/api/auth/login`,
		JSON.stringify({
			email: 'admin@tech-service.local',
			password: 'Demo12345!',
		}),
		{ headers: { 'Content-Type': 'application/json' } },
	);
	check(loginRes, { 'login succeeded': (r) => r.status === 200 });
	const token = loginRes.json('accessToken');

	const headers = { headers: { Authorization: `Bearer ${token}` } };
	const equipmentRes = http.get(`${BASE_URL}/api/equipment?limit=1`, headers);
	const siteId = equipmentRes.json('data.0.siteId');

	return { token, siteId };
}

export default function (data) {
	const headers = { headers: { Authorization: `Bearer ${data.token}` } };
	const pick = Math.random();

	let res;
	if (pick < 0.4) {
		res = http.get(`${BASE_URL}/api/equipment?limit=20`, headers);
	} else if (pick < 0.7) {
		res = http.get(`${BASE_URL}/api/requests?limit=20`, headers);
	} else if (pick < 0.9) {
		res = http.get(`${BASE_URL}/api/reports/equipment-load`, headers); // кэшируется на nginx (30с)
	} else {
		res = http.get(`${BASE_URL}/api/sites/${data.siteId}/summary`, headers);
	}

	check(res, {
		'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
	});
	sleep(0.5);
}
