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

export const tools = {
    list: async () => {
        const res = await fetch(`${API_URL}/tools`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tools');
        return res.json();
    },
    create: async (name, toolType = 'time', selectedExam = 'GATE') => {
        const res = await fetch(`${API_URL}/tools`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, toolType, selectedExam })
        });
        if (!res.ok) throw new Error('Failed to create tool');
        return res.json();
    },
    get: async (toolId) => {
        const res = await fetch(`${API_URL}/tools/${toolId}`, { headers: getHeaders() });
        return res.json();
    },
    update: async (toolId, updates) => {
        const res = await fetch(`${API_URL}/tools/${toolId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        return res.json();
    },
    delete: async (toolId) => {
        const res = await fetch(`${API_URL}/tools/${toolId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return res.json();
    }
};

export const syllabus = {
    get: async (toolId = null) => {
        const url = toolId ? `${API_URL}/syllabus?toolId=${toolId}` : `${API_URL}/syllabus`;
        const res = await fetch(url, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch syllabus');
        return res.json();
    },
    createSubject: async (name, toolId = null) => {
        const res = await fetch(`${API_URL}/syllabus/subject`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, toolId })
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

export const streak = {
    getToolStreak: async (toolId, year, month) => {
        const res = await fetch(`${API_URL}/streak/tool/${toolId}?year=${year}&month=${month}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tool streak');
        return res.json();
    },
    getUserStreak: async () => {
        const res = await fetch(`${API_URL}/streak/user`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch user streak');
        return res.json();
    }
};

export const flashcards = {
    // DECKS
    createDeck: async (toolId, name) => {
        const res = await fetch(`${API_URL}/flashcards/decks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ toolId, name })
        });
        if (!res.ok) throw new Error('Failed to create deck');
        return res.json();
    },
    getDecks: async (toolId) => {
        const res = await fetch(`${API_URL}/flashcards/tools/${toolId}/decks`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch decks');
        return res.json();
    },
    getAnalytics: async (toolId) => {
        const res = await fetch(`${API_URL}/flashcards/tools/${toolId}/analytics`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
    },
    deleteDeck: async (deckId) => {
        const res = await fetch(`${API_URL}/flashcards/decks/${deckId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete deck');
        return res.json();
    },

    // CARDS
    createCard: async (deckId, frontContent, backContent, sourceTopicId = null) => {
        const res = await fetch(`${API_URL}/flashcards/decks/${deckId}/cards`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ frontContent, backContent, sourceTopicId })
        });
        if (!res.ok) throw new Error('Failed to create card');
        return res.json();
    },
    getCards: async (deckId) => {
        const res = await fetch(`${API_URL}/flashcards/decks/${deckId}/cards`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch cards');
        return res.json();
    },
    updateCard: async (cardId, frontContent, backContent) => {
        const res = await fetch(`${API_URL}/flashcards/cards/${cardId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ frontContent, backContent })
        });
        if (!res.ok) throw new Error('Failed to update card');
        return res.json();
    },
    getDueCards: async (deckId) => {
        const res = await fetch(`${API_URL}/flashcards/decks/${deckId}/due`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch due cards');
        return res.json();
    },
    deleteCard: async (cardId) => {
        const res = await fetch(`${API_URL}/flashcards/cards/${cardId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete card');
        return res.json();
    },

    // REVIEW
    submitReview: async (cardId, score) => {
        const res = await fetch(`${API_URL}/flashcards/cards/${cardId}/review`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ score })
        });
        if (!res.ok) throw new Error('Failed to submit review');
        return res.json();
    }
};

export const upload = {
    image: async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        // Note: Do not override Content-Type so browser sets multipart boundary automatically

        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers,
            body: formData
        });
        if (!res.ok) throw new Error((await res.json()).msg || 'Upload failed');
        return res.json();
    }
};

export const focus = {
    getTaggableItems: async () => {
        const res = await fetch(`${API_URL}/focus/taggable-items`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch taggable items');
        return res.json();
    },
    logSession: async (data) => {
        const res = await fetch(`${API_URL}/focus/sessions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to log session');
        return res.json();
    },
    getSessions: async (toolId) => {
        const res = await fetch(`${API_URL}/focus/tools/${toolId}/sessions`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
    },
    getStats: async (toolId) => {
        const res = await fetch(`${API_URL}/focus/tools/${toolId}/stats`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    }
};
