const THREE_SECONDS = 3 * 1000;

let messages = [];

const showSideMenu = () => {
    document.querySelector('.side-menu-container').classList.remove('hidden');
};

const hideSideMenu = () => {
    document.querySelector('.side-menu-container').classList.add('hidden');
};

const selectItem = itemEl => {
    if(itemEl.classList.contains('selected')) return;

    const listTypeEl = itemEl.parentNode;
    const selectedItemEl = listTypeEl.querySelector('.selected');

    if(selectedItemEl) selectedItemEl.classList.remove('selected');
    itemEl.classList.add('selected');
};

const getMessageTypeClass = messageType => {
    switch(messageType) {
        case 'status':
            return 'status';

        case 'message':
            return 'normal';

        case 'private_message':
            return 'reserved';
    }
};

const getReservedString = message => {
    return `${message.type === 'private_message' ? 'reservadamente ' : ''}`;
};

const getReceiverMessage = message => {
    return `${message.type !== 'status' ? `${getReservedString(message)}para <span class="username">${message.to}</span>:` : ''}`;
};

const renderMessages = () => {
    const messageElements = messages.map(message => {
        return `<div class="message ${getMessageTypeClass(message.type)}-message">
            <p>
                <span class="hour">(${message.time})</span>
                <span class="username">${message.from}</span>
                ${getReceiverMessage(message)}
                ${message.text}
            </p>
        </div>`;
    });

    document.querySelector('.messages-container').innerHTML = messageElements.length > 0 ? messageElements.join('') : '<p>Nenhuma mensagem!</p>';
};

const renderMessagesError = () => {
    document.querySelector('.messages-container').innerHTML = '<p>Não foi possível recuperar as mensagens do servidor!</p>';
};

const getMessages = () => {
    axios
        .get("https://mock-api.driven.com.br/api/v6/uol/messages")
        .then(response => {
            messages = response.data;
            renderMessages();
        })
        .catch(renderMessagesError);
};

const refreshMessagesPeriodically = () => {
    setInterval(getMessages, THREE_SECONDS);
};

getMessages();
refreshMessagesPeriodically();
