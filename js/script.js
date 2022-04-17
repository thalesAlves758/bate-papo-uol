const THREE_SECONDS = 3 * 1000;
const FIVE_SECONDS = 5 * 1000;
const TEN_SECONDS = 10 * 1000;
const BAD_REQUEST_STATUS = 400;
const EVERYBODY_NAME = 'Todos';
const NORMAL_MESSAGE_NAME = 'message';
const STATUS_MESSAGE_NAME = 'status';
const RESERVED_MESSAGE_NAME = 'private_message';
const ENTER_KEY = 'Enter';

let messages = [];
let participants = [];
let username;
let currentParticipantSelected = EVERYBODY_NAME;
const userMessage = {
  from: '',
  to: EVERYBODY_NAME,
  text: '',
  type: NORMAL_MESSAGE_NAME,
};

const addKeyupEvents = () => {
  document.querySelector('.bottom-bar input').addEventListener('keyup', event => {
    event.preventDefault();

    if (event.key === ENTER_KEY) {
      document.querySelector('.bottom-bar button').click();
      return;
    }

    userMessage.text = event.target.value;
  });

  document.querySelector('.entry-form input').addEventListener('keyup', event => {
    event.preventDefault();

    if (event.key === ENTER_KEY) {
      document.querySelector('.entry-form button').click();
      return;
    }

    removeNameErrorMessage();
    username = event.target.value.trim();

    if (username !== '') {
      ableLoginButton();
      return;
    }
    disableLoginButton();
  });
};

const showSideMenu = () => document.querySelector('.side-menu-container').classList.remove('hidden');

const hideSideMenu = () => document.querySelector('.side-menu-container').classList.add('hidden');

const getLegendText = () => {
  if (userMessage.to !== EVERYBODY_NAME) {
    return `Enviando para ${userMessage.to} ${userMessage.type === RESERVED_MESSAGE_NAME ? '(reservadamente)' : ''}`;
  }
  return '';
};

const updateInputLegendElement = () => document.querySelector('.bottom-bar .legend').innerHTML = getLegendText();

const selectItem = itemEl => {
  if (itemEl.classList.contains('selected')) return;

  const listTypeEl = itemEl.parentNode;
  const selectedItemEl = listTypeEl.querySelector('.selected');

  if (selectedItemEl) selectedItemEl.classList.remove('selected');
  itemEl.classList.add('selected');

  updateMessageReceiver();
  updateMessageType();
  updateInputLegendElement();
};

const getMessageTypeClass = messageType => {
  switch (messageType) {
    case NORMAL_MESSAGE_NAME:
      return 'normal';

    case RESERVED_MESSAGE_NAME:
      return 'reserved';

    default:
      return messageType;
  }
};

const getReservedString = message => message.type === RESERVED_MESSAGE_NAME ? 'reservadamente ' : '';

const getReceiverMessage = message => message.type !== STATUS_MESSAGE_NAME ? `${getReservedString(message)}para <span class="username">${message.to}</span>:` : '';

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

const renderMessagesError = () => document.querySelector('.messages-container').innerHTML = '<p>Não foi possível recuperar as mensagens do servidor!</p>';

const addScrollToLastMessage = () => document.querySelector('.message:last-child').scrollIntoView();

const canShowMessage = message => message.type !== RESERVED_MESSAGE_NAME || (message.to === EVERYBODY_NAME || message.to === username || message.from === username);

const filterMessages = messages => messages.filter(canShowMessage);

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

const refreshMessagesPeriodically = () => setInterval(getMessages, THREE_SECONDS);

const refreshParticipantsPeriodically = () => setInterval(getParticipants, TEN_SECONDS);

const disableLoginButton = () => document.querySelector('.entry-form button').disabled = true;

const ableLoginButton = () => document.querySelector('.entry-form button').disabled = false;

const renderNameErrorMessage = () => {
  document.querySelector('.entry-form .incorrect-message').innerHTML = "Este nome já está em uso. Por favor, tente outro!";
  document.querySelector('.entry-form .input').classList.add('invalid');
};

const removeNameErrorMessage = () => {
  document.querySelector('.entry-form .incorrect-message').innerHTML = "";
  document.querySelector('.entry-form .input').classList.remove('invalid');
};

const hideLoginForm = () => document.querySelector('.entry-container').classList.add('hidden');

const showLoadingGif = () => {
  document.querySelector('.loading-container').classList.remove('hidden');
  document.querySelector('.entry-form').classList.add('hidden');
};

const hideLoadingGif = () => {
  document.querySelector('.loading-container').classList.add('hidden');
  document.querySelector('.entry-form').classList.remove('hidden');
};

const login = () => {
  disableLoginButton();
  showLoadingGif();

  axios
    .post("https://mock-api.driven.com.br/api/v6/uol/participants", { name: username })
    .then(() => {
      hideLoginForm();
      updateMessageSender();
      keepLogged();
      getMessages();
      refreshMessagesPeriodically();
      getParticipants();
      refreshParticipantsPeriodically();
    })
    .catch(error => {
      if (error.response.status === BAD_REQUEST_STATUS) {
        renderNameErrorMessage();
        hideLoadingGif();
      }
    });
};

const updateMessageReceiver = () => {
  const participantName = document.querySelector('.participants .selected').dataset.participant;
  userMessage.to = participantName;
  currentParticipantSelected = participantName;
};

const updateMessageSender = () => userMessage.from = username;

const updateMessageType = () => userMessage.type = document.querySelector('.visibilities .selected').dataset.visibility;

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
  userMessage.text = userMessage.text.trim();

  if (userMessage.text === '') {
    return;
  }

  axios
    .post("https://mock-api.driven.com.br/api/v6/uol/messages", userMessage)
    .then(() => {
      getMessages();
      document.querySelector('.bottom-bar input').value = '';
      userMessage.text = '';
    })
    .catch(logout);
};

const filterParticipants = participants => participants.filter(participant => participant.name !== username);

const renderParticipants = () => {
  participants.unshift({ name: EVERYBODY_NAME });

  const participantsElements = participants.map(participant => `<li onClick="selectItem(this)" data-participant="${participant.name}" ${participant.name === currentParticipantSelected ? 'class="selected"' : ''}>
        <div class="left">
            <ion-icon name="${participant.name === EVERYBODY_NAME ? 'people' : 'person-circle'}"></ion-icon>
            <span class="participantName">${participant.name}</span>
        </div>
        <ion-icon name="checkmark"></ion-icon>
    </li>`);

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

window.onload = addKeyupEvents;
