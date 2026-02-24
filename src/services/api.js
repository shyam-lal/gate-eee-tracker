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

export const user = {
    me: async () => {
        const res = await fetch(`${API_URL}/user/me`, { headers: getHeaders() });
        return res.json();
    },
    updatePreferences: async (selected_exam, tracking_mode) => {
        const res = await fetch(`${API_URL}/user/preferences`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ selected_exam, tracking_mode })
        });
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
    createTopic: async (subjectId, name, estimatedMinutes = 0, totalModules = 0) => {
        const res = await fetch(`${API_URL}/syllabus/topic`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ subjectId, name, estimatedMinutes, totalModules })
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
    logActivity: async (data) => {
        // data: { topicId, minutes, modules, subjectId }
        const res = await fetch(`${API_URL}/syllabus/log`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },
    editLog: async (logId, minutes, modules) => {
        const res = await fetch(`${API_URL}/syllabus/log/${logId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ minutes, modules })
        });
        return res.json();
    },
    getLogs: async (topicId) => {
        const res = await fetch(`${API_URL}/syllabus/logs?topicId=${topicId || ''}`, { headers: getHeaders() });
        return res.json();
    },
    resetProgress: async () => {
        const res = await fetch(`${API_URL}/syllabus/reset`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return res.json();
    }
};

export const social = {
    getFollowing: async () => {
        const res = await fetch(`${API_URL}/social/info`, { headers: getHeaders() });
        return res.json();
    },
    follow: async (followingId) => {
        const res = await fetch(`${API_URL}/social/follow`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ followingId })
        });
        return res.json();
    },
    unfollow: async (followingId) => {
        const res = await fetch(`${API_URL}/social/unfollow/${followingId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return res.json();
    },
    search: async (q) => {
        const res = await fetch(`${API_URL}/social/search?q=${q}`, { headers: getHeaders() });
        return res.json();
    },
    getProfile: async (userId) => {
        const res = await fetch(`${API_URL}/social/profile/${userId}`, { headers: getHeaders() });
        return res.json();
    },
    getAchievements: async () => {
        const res = await fetch(`${API_URL}/social/achievements`, { headers: getHeaders() });
        return res.json();
    }
};
