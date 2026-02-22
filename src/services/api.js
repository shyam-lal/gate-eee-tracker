// We use a relative path here so that Vite's proxy (in development) 
// or the production server can handle the routing correctly.
const API_URL = '/api';


const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const auth = {
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
        return res.json();
    },
    register: async (username, email, password) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
        return res.json();
    }
};

export const syllabus = {
    get: async () => {
        const res = await fetch(`${API_URL}/syllabus`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch syllabus');
        return res.json();
    },
    createSubject: async (name) => {
        const res = await fetch(`${API_URL}/syllabus/subject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name })
        });
        return res.json();
    },
    updateSubject: async (subjectId, name) => {
        const res = await fetch(`${API_URL}/syllabus/subject/${subjectId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ name })
        });
        return res.json();
    },
    deleteSubject: async (subjectId) => {
        const res = await fetch(`${API_URL}/syllabus/subject/${subjectId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return res.json();
    },
    createTopic: async (subjectId, name, estimatedMinutes) => {
        const res = await fetch(`${API_URL}/syllabus/topic`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ subjectId, name, estimatedMinutes })
        });
        return res.json();
    },
    updateTopic: async (topicId, updates) => {
        const res = await fetch(`${API_URL}/syllabus/topic/${topicId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        return res.json();
    },
    deleteTopic: async (topicId) => {
        const res = await fetch(`${API_URL}/syllabus/topic/${topicId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return res.json();
    },
    logTime: async (data) => {
        // data: { topicId, minutes } OR { subjectId, minutes }
        const res = await fetch(`${API_URL}/syllabus/log`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    }
};
