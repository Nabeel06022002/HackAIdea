const input = document.getElementById('text');
const sendBtn = document.getElementById('sendBtn');
const chat = document.getElementById('message-area');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const chatArea = document.getElementById('chatArea');

let chats = [];
let currentChatIndex = -1;

// *** FIX FLAG ***
let isLoadingChat = false;

function createNewChat() {
    chats.push([]);
    currentChatIndex = chats.length - 1;
    renderChatList();
    loadChat();
}

function renderChatList() {
    chatList.innerHTML = '';
    chats.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = 'chat-item' + (i === currentChatIndex ? ' active' : '');
        item.textContent = 'Chat ' + (i + 1);
        item.onclick = () => {
            currentChatIndex = i;
            renderChatList();
            loadChat();
        };
        chatList.appendChild(item);
    });
}

function sanitizeMessage(text) {
    return text.replace(/<span class="thinking-dot">.*?<\/span>/g, '');
}

function addMessage(text, type) {
    const row = document.createElement('div');
    row.className = 'msg-row';

    const icon = document.createElement('div');
    icon.className = 'msg-icon';
    icon.innerHTML =
        type === 'user'
            ? '<i class="fas fa-user"></i>'
            : '<i class="fas fa-robot"></i>';

    const msg = document.createElement('div');
    msg.className = type === 'user' ? 'msg msg-user' : 'msg msg-bot';
    msg.innerHTML = text;

    if (type === 'user') {
        row.appendChild(msg);
        row.appendChild(icon);
    } else {
        row.appendChild(icon);
        row.appendChild(msg);
    }

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;

    if (!isLoadingChat && type !== 'thinking') {
        chats[currentChatIndex].push({ text: sanitizeMessage(text), type });
    }

    return msg;
}

function loadChat() {
    isLoadingChat = true;

    chat.innerHTML = '';

    chats[currentChatIndex].forEach((m) =>
        addMessage(sanitizeMessage(m.text), m.type)
    );

    isLoadingChat = false;
}

function addThinking() {
    const thinkingDots =
        '<span class="thinking-dot">.</span>' +
        '<span class="thinking-dot">.</span>' +
        '<span class="thinking-dot">.</span>';
    return addMessage(thinkingDots, 'thinking');
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text || currentChatIndex === -1) return;

    addMessage(text, 'user');
    input.value = '';

    const thinkingMsg = addThinking();

    try {
        const formData = new FormData();
        formData.append("msg", text);

        const response = await fetch("/get", {
            method: "POST",
            body: formData
        });

        const botReply = await response.text();
        const cleanReply = sanitizeMessage(botReply);

        thinkingMsg.innerHTML = cleanReply;
        chats[currentChatIndex].push({ text: cleanReply, type: 'bot' });

    } catch (err) {
        thinkingMsg.innerHTML = "Error: Could not reach server.";
        chats[currentChatIndex].push({
            text: "Error: Could not reach server.",
            type: 'bot'
        });
    }
}

sendBtn.onclick = sendMessage;

input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

document.querySelectorAll(".suggested-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        input.value = chip.textContent;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    });
});

toggleSidebar.onclick = () => {
    sidebar.classList.toggle("collapsed");
    chatArea.classList.toggle("expanded");

    if (sidebar.classList.contains("collapsed")) {
        newChatBtn.classList.add("collapsed-btn");
        newChatBtn.innerHTML = '<i class="fas fa-comments"></i>';
    } else {
        newChatBtn.classList.remove("collapsed-btn");
        newChatBtn.innerHTML = '<i class="fas fa-plus"></i> <span class="btn-text">New Chat</span>';
    }
};

newChatBtn.onclick = createNewChat;

createNewChat();
