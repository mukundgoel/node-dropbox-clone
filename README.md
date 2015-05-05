# node-dropbox-clone

#### Overview
* A basic Dropbox clone created as part of Codepath's Node.JS Bootcamp<br />
* The client can send support HTTP commands to create files on the server<br />
* The client can sync the server directory in a directory on their local machine<br />

######Time spent: 12 hours

#### To Run:
1. Run `bode server.js` or `npm start` in a terminal window (to start the server)
2. In another terminal:
  1. For TCP Sync, simply run `bode client.js`
  2. For HTTP Sync, simply send a supported HTTP command
  3. Or you can do both in different terminals!!

(hint: you can also pass `--dir` param to set a directory in both the server and client)

######Supported HTTP commands:
* GET *a file or directory*: `curl -v http://127.0.0.1:8000/foo2.js -X GET`

* POST *(update) a file*: `curl -v http://127.0.0.1:8000/foo2.js -X POST -d "data"`

* PUT *(create) a file or directory*: `curl -v http://127.0.0.1:8000/foo2.js -X PUT -d "data"`

* DELETE *a file or directory*: `curl -v http://127.0.0.1:8000/foo2.js -X DELETE`

###Features:
- [x] Client can make GET requests to get file or directory contents
![get](https://cloud.githubusercontent.com/assets/10262447/7460712/022dea6c-f25a-11e4-8677-56bf781a3ce9.gif)

- [x] Client can make HEAD request to get just the GET headers
![head](https://cloud.githubusercontent.com/assets/10262447/7460713/023efa78-f25a-11e4-9577-b80030769305.gif)

- [x] Client can make PUT requests to create new directories and files with content
![put](https://cloud.githubusercontent.com/assets/10262447/7460714/0240ca10-f25a-11e4-88f2-563fc2866bc3.gif)

- [x] Client can make POST requests to update the contents of a file
![post](https://cloud.githubusercontent.com/assets/10262447/7460715/024415d0-f25a-11e4-82e3-6c637b6e0a6c.gif)

- [x] Client can make DELETE requests to delete files and folders
![delete](https://cloud.githubusercontent.com/assets/10262447/7460711/022ce432-f25a-11e4-865f-0c84c20c8662.gif)

- [x] Server will serve from --dir or cwd as root
![dir](https://cloud.githubusercontent.com/assets/10262447/7460920/64b9b0c0-f25b-11e4-9b60-b3484d7569a1.gif)

- [x] Client will sync from server over TCP to cwd or CLI dir argument
![tcp_client](https://cloud.githubusercontent.com/assets/10262447/7464790/f632a236-f27a-11e4-92cc-d83956a8687d.gif)

###Additional Features
- [x] Download initial directory contents when TCP client connects to server
![client](https://cloud.githubusercontent.com/assets/10262447/7461412/efab643c-f25e-11e4-82ae-dd3076ab62d8.gif)
