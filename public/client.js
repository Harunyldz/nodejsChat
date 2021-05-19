
let joinerName;
let textArea = document.querySelector('#textarea')
let messageArea = document.querySelector('.message_area')


const socket = io("http://localhost:3000");


do {
    joinerName = prompt('please enter your name');
} while (!joinerName)

textArea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        sentMessage(e.target.value)
    }
})


function sentMessage(message, to = "everyone") {

    let msg = {
        user: joinerName,
        message: message.trim(),
        to: to
    }

    appendMessage(msg, 'outgoing')
    textArea.value = ''
    scrollToBottom()
    //sent to server

    socket.emit('message', msg)

}

var sendUserInfo = function(){
    socket.emit('command', {
        user: joinerName,
        message: "writeUser"
    });
}

sendUserInfo();

function requestUsers() {
    socket.emit('command', {
        user: joinerName,
        message: "getUsers"
    });
}

function appendMessage(msg, type) {
    let mainDiv = document.createElement("div")
    let classname = type
    mainDiv.classList.add(classname, 'message')

    let markUp = `
    <h4>${msg.user}</h4>
    <p>${msg.message}</P>
    `
    mainDiv.innerHTML = markUp;
    messageArea.appendChild(mainDiv);
}

socket.on('message', (msg) => {
    appendMessage(msg, 'incomming');
    scrollToBottom();
});

socket.on('command', (msg) => {

    console.log(msg);

});

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight
}