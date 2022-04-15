const THREE_SECONDS = 3 * 1000;
const FIVE_SECONDS = 5 * 1000;
const TEN_SECONDS = 10 * 1000;
const BAD_REQUEST_STATUS = 400;
const EVERYBODY_NAME = 'Todos';
const NORMAL_MESSAGE_NAME = 'message';
const STATUS_MESSAGE_NAME = 'status';
const RESERVED_MESSAGE_NAME = 'private_message';

let messages = [];
let participants = [];
let username;
let currentParticipantSelected = EVERYBODY_NAME;
let userMessage = {
    from: '',
    to: EVERYBODY_NAME,
    text: '',
    type: NORMAL_MESSAGE_NAME,
};

const showSideMenu = () => {
    document.querySelector('.side-menu-container').classList.remove('hidden');
};

const hideSideMenu = () => {
    document.querySelector('.side-menu-container').classList.add('hidden');
};

const getLegendText = () => {
    if(userMessage.to !== 'Todos') {
        return `Enviando para ${userMessage.to} ${userMessage.type === RESERVED_MESSAGE_NAME ? '(reservadamente)' : ''}`;
    }
    return '';
};

const updateInputLegendElement = () => document.querySelector('.bottom-bar .legend').innerHTML = getLegendText();

const selectItem = itemEl => {
    if(itemEl.classList.contains('selected')) return;

    const listTypeEl = itemEl.parentNode;
    const selectedItemEl = listTypeEl.querySelector('.selected');

    if(selectedItemEl) selectedItemEl.classList.remove('selected');
    itemEl.classList.add('selected');

    updateMessageReceiver();
    updateMessageType();
    updateInputLegendElement();
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
    return message.type === 'private_message' ? 'reservadamente ' : '';
};

const getReceiverMessage = message => {
    return message.type !== 'status' ? `${getReservedString(message)}para <span class="username">${message.to}</span>:` : '';
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

const addScrollToLastMessage = () => {
    document.querySelector('.message:last-child').scrollIntoView();
};

const canShowMessage = message => {
    return message.from === username || message.to === username || message.type !== 'private_message';
};

const filterMessages = messages => {
    return messages.filter(canShowMessage);
};

const getMessages = () => {
    axios
        .get("https://mock-api.driven.com.br/api/v6/uol/messages")
        .then(response => {
            messages = filterMessages(response.data);
            renderMessages();
            addScrollToLastMessage();
        })
        .catch(renderMessagesError);
};

const refreshMessagesPeriodically = () => {
    setInterval(getMessages, THREE_SECONDS);
};

const refreshParticipantsPeriodically = () => {
    setInterval(getParticipants, TEN_SECONDS);
};

const login = () => {
    axios
        .post("https://mock-api.driven.com.br/api/v6/uol/participants", { name: username })
        .then(() => {
            updateMessageSender();
            keepLogged();
            getMessages();
            refreshMessagesPeriodically();
            getParticipants();
            refreshParticipantsPeriodically();
        })
        .catch(error => {
            if(error.response.status === BAD_REQUEST_STATUS) {
                alert('Este nome já está em uso. Por favor, tente outro!');
                requestUsername();
            }
        });
};

const updateMessageText = inputEl => {
    userMessage.text = inputEl.value;
};

const updateMessageReceiver = () => {
    const participantName = document.querySelector('.participants .selected').dataset.participant;
    userMessage.to = participantName;
    currentParticipantSelected = participantName;
};

const updateMessageSender = () => {
    userMessage.from = username;
};

const updateMessageType = () => {
    userMessage.type = document.querySelector('.visibilities .selected').dataset.visibility;
};

const requestUsername = () => {
    username = prompt('Qual é o seu lindo nome?');
    login();
};

const logout = () => {
    alert("Você foi deslogado. A página será reiniciada para que possa logar novamente.");
    window.location.reload();
};

const keepLogged = () => {
    setInterval(() => {
        axios
            .post("https://mock-api.driven.com.br/api/v6/uol/status", { name: username })
            .catch(logout);
    }, FIVE_SECONDS);
};

const sendMessage = () => {
    document.querySelector('.bottom-bar input').value = '';
    
    userMessage.text = userMessage.text.trim();
    
    if(userMessage.text === '') {
        return;
    }

    axios
        .post("https://mock-api.driven.com.br/api/v6/uol/messages", userMessage)
        .then(getMessages)
        .catch(logout);
};

const filterParticipants = participants => {
    return participants.filter(participant => participant.name !== username);
};

const renderParticipants = () => {
    participants.unshift({ name: EVERYBODY_NAME });

    const participantsElements = participants.map(participant => {
        return `<li onClick="selectItem(this)" data-participant="${participant.name}" ${participant.name === currentParticipantSelected ? 'class="selected"' : ''}>
            <div class="left">
                <ion-icon name="${participant.name === EVERYBODY_NAME ? 'people' : 'person-circle'}"></ion-icon>
                <span class="participantName">${participant.name}</span>
            </div>
            <ion-icon name="checkmark"></ion-icon>
        </li>`;
    });

    document.querySelector('.participants').innerHTML = participantsElements.join('');
};

const renderParticipantsError = () => {
    renderParticipants();
    document.querySelector('.participants').innerHTML += '<p>Não foi possível recuperar os participantes.</p>';
}

const getParticipants = () => {
    axios
        .get("https://mock-api.driven.com.br/api/v6/uol/participants")
        .then(response => {
            participants = filterParticipants(response.data);
            renderParticipants();
            updateMessageReceiver();
            updateMessageType();
        })
        .catch(renderParticipantsError);
};

requestUsername();
