const THREE_SECONDS = 3 * 1000;
const FIVE_SECONDS = 5 * 1000;
const BAD_REQUEST_STATUS = 400;

let messages = [];
let username;

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

const addScrollToLastMessage = () => {
    document.querySelector('.message:last-child').scrollIntoView();
};

const filterMessages = messages => {
    return messages.filter(message => message.type !== 'private_message' || message.to === username);
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

const requestUsername = () => {
    username = prompt('Qual é o seu lindo nome?');
    login();
};

const keepLogged = () => {
    setInterval(() => {
        axios
            .post("https://mock-api.driven.com.br/api/v6/uol/status", { name: username })
            .catch(() => {
                alert("Você foi deslogado. A página será reiniciada para que possa logar novamente.");
                window.location.reload();
            });
    }, FIVE_SECONDS);
};

const login = () => {
    axios
        .post("https://mock-api.driven.com.br/api/v6/uol/participants", { name: username })
        .then(() => {
            keepLogged();
            getMessages();
            refreshMessagesPeriodically();
        })
        .catch(error => {
            const { status } = error.response;

            if(status === BAD_REQUEST_STATUS) {
                alert('Este nome já está em uso. Por favor, tente outro!');
                requestUsername();
            }
        });
};

requestUsername();
