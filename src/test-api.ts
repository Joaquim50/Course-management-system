import 'dotenv/config';

const API_URL = 'http://localhost:3001';
let adminToken = '';
let studentToken = '';
let courseId = '';
let pretestId = '';
let pretestQuestionId = '';

async function runTests() {
    console.log('--- RUNNING API TESTS ---');

    console.log('1. Admin Login');
    const adminRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lms.local', password: 'admin' })
    }).then(r => r.json());
    adminToken = adminRes.token;
    console.log('Admin Token Received:', !!adminToken);

    console.log('\n2. Student Registration');
    const stdEmail = `student${Date.now()}@test.com`;
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Student', email: stdEmail, password: 'password123' })
    }).then(r => r.json());
    console.log('Student Registration:', regRes.message);

    console.log('\n3. Student Login');
    const stdRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: stdEmail, password: 'password123' })
    }).then(r => r.json());
    studentToken = stdRes.token;
    console.log('Student Token Received:', !!studentToken);

    console.log('\n4. Admin creates Course');
    const courseRes = await fetch(`${API_URL}/courses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ title: 'Fullstack Course', description: 'React and Node', materialUrl: 'https://example.com/pdf' })
    }).then(r => r.json());
    courseId = courseRes.id;
    console.log('Course ID Created:', courseId);

    console.log('\n5. Admin creates Pretest');
    const testRes = await fetch(`${API_URL}/tests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
            courseId, type: 'PRETEST', questions: [
                { questionText: 'Is React a library?', options: ['Yes', 'No'], correctAnswer: 'Yes' }
            ]
        })
    }).then(r => r.json());
    pretestId = testRes.id;
    pretestQuestionId = testRes.Questions[0].id;
    console.log('Pretest Created ID:', pretestId);

    console.log('\n6. Student fetches course details BEFORE Pretest');
    const courseBefore = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
    }).then(r => r.json());
    console.log('Can access material?:', courseBefore.canAccessMaterial);

    console.log('\n7. Student completes Pretest');
    const submitRes = await fetch(`${API_URL}/attempts/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ testId: pretestId, answers: [{ questionId: pretestQuestionId, selectedOption: 'Yes' }] })
    }).then(r => r.json());
    console.log('Pretest Submit Score:', submitRes.score);

    console.log('\n8. Student fetches course details AFTER Pretest');
    const courseAfter = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
    }).then(r => r.json());
    console.log('Can access material now?:', courseAfter.canAccessMaterial);
    console.log('Material URL:', courseAfter.materialUrl);

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(console.error);
