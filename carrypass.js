
    
    function generateRandomPasswordKey(webAddress, password, iterationCount, salt, length) {
      let inputStr = webAddress + password;
      // let combinedStr = inputStr + salt;

      let iterations = iterationCount;
      let hashBytes = CryptoJS.PBKDF2(inputStr, salt, { keySize: length/4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });

      let encodedString = bytesToAlphaNumericString(hashBytes);
      let key = '';

      let fullSegments = Math.floor(length / 7);
      let remainder = length % 7;

      for (let i = 0; i < fullSegments; i++) {
        key += encodedString.slice(i * 7, (i + 1) * 7) + '-';
      }

      if (remainder > 0) {
        key += encodedString.slice(fullSegments * 7, fullSegments * 7 + remainder);
      } else {
        key = key.slice(0, -1);
      }

      return key;
    }

    function generateRandomLetterKey(webAddress, password, iterationCount, salt, length) {
      let inputStr = webAddress + password;

      let iterations = iterationCount;
      let hashBytes = CryptoJS.PBKDF2(inputStr, salt, { keySize: length/4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });

      let encodedString = bytesToAlphaString(hashBytes);
      let key = '';

      let fullSegments = Math.floor(length / 7);
      let remainder = length % 7;

      for (let i = 0; i < fullSegments; i++) {
        key += encodedString.slice(i * 7, (i + 1) * 7) + '';
      }

      if (remainder > 0) {
        key += encodedString.slice(fullSegments * 7, fullSegments * 7 + remainder);
      } else {
        key = key.slice(0, -1);
      }

      return key;
    }

    function generateRandomNumberKey(webAddress, password, iterationCount, salt, length) {
      let inputStr = webAddress + password;
     

      let iterations = iterationCount;
      let hashBytes = CryptoJS.PBKDF2(inputStr, salt, { keySize: length/4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });

      let encodedString = bytesToNumericString(hashBytes);
      let key = '';

      let fullSegments = Math.floor(length / 7);
      let remainder = length % 7;

      for (let i = 0; i < fullSegments; i++) {
        key += encodedString.slice(i * 7, (i + 1) * 7) + '';
      }

      if (remainder > 0) {
        key += encodedString.slice(fullSegments * 7, fullSegments * 7 + remainder);
      } else {
        key = key.slice(0, -1);
      }

      return key;
    }


    function generateRandomMixedKey(webAddress, password, iterationCount, salt, length) {
      let inputStr = webAddress + password;
    
      let iterations = iterationCount;
      let hashBytes = CryptoJS.PBKDF2(inputStr, salt, { keySize: length/4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });

      let encodedString = bytesToAlphaNumericString(hashBytes);
      let key = '';

      let fullSegments = Math.floor(length / 7);
      let remainder = length % 7;

      for (let i = 0; i < fullSegments; i++) {
        key += encodedString.slice(i * 7, (i + 1) * 7) + '';
      }

      if (remainder > 0) {
        key += encodedString.slice(fullSegments * 7, fullSegments * 7 + remainder);
      } else {
        key = key.slice(0, -1);
      }

      return key;
    }


    function generateRandomSpecialKey(webAddress, password, iterationCount, salt, length) {
      let inputStr = webAddress + password;
     

      let iterations = iterationCount;
      let hashBytes = CryptoJS.PBKDF2(inputStr, salt, { keySize: length/4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });

      let encodedString = bytesToMoreSpecialString(hashBytes);
      let key = '';

      let fullSegments = Math.floor(length / 7);
      let remainder = length % 7;

      for (let i = 0; i < fullSegments; i++) {
        key += encodedString.slice(i * 7, (i + 1) * 7) + '';
      }

      if (remainder > 0) {
        key += encodedString.slice(fullSegments * 7, fullSegments * 7 + remainder);
      } else {
        key = key.slice(0, -1);
      }

      return key;
    }


function bytesToAlphaNumericString(bytes) {
  let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  let hasLowercase = false;
  let hasUppercase = false;
  let hasDigit = false;

  for (let i = 0; i < bytes.words.length * 4; i++) {
    let byte = (bytes.words[Math.floor(i / 4)] >> (24 - (i % 4) * 8)) & 0xff;
    let char = charset.charAt(byte % charset.length);

   
    if (!hasLowercase && /[a-z]/.test(char)) {
      hasLowercase = true;
    } else if (!hasUppercase && /[A-Z]/.test(char)) {
      hasUppercase = true;
    } else if (!hasDigit && /[0-9]/.test(char)) {
      hasDigit = true;
    }

    result += char;
  }

  
  if (!(hasLowercase && hasUppercase && hasDigit)) {
   
    return bytesToAlphaNumericString(bytes);
  }

  return result;
}

function bytesToAlphaString(bytes) {
  let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let hasLowercase = false;
  let hasUppercase = false;

  for (let i = 0; i < bytes.words.length * 4; i++) {
    let byte = (bytes.words[Math.floor(i / 4)] >> (24 - (i % 4) * 8)) & 0xff;
    let char = charset.charAt(byte % charset.length);

    
    if (!hasLowercase && /[a-z]/.test(char)) {
      hasLowercase = true;
    } else if (!hasUppercase && /[A-Z]/.test(char)) {
      hasUppercase = true;
    }

    result += char;
  }

  
  if (!(hasLowercase && hasUppercase)) {
    
    return bytesToAlphaString(bytes);
  }

  return result;
}


function bytesToMoreSpecialString(bytes) {
  let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
  let result = '';
  let hasLowercase = false;
  let hasUppercase = false;
  let hasDigit = false;
  let hasPunctuation = false;

  for (let i = 0; i < bytes.words.length * 4; i++) {
    let byte = (bytes.words[Math.floor(i / 4)] >> (24 - (i % 4) * 8)) & 0xff;
    let char = charset.charAt(byte % charset.length);

    
    if (!hasLowercase && /[a-z]/.test(char)) {
      hasLowercase = true;
    } else if (!hasUppercase && /[A-Z]/.test(char)) {
      hasUppercase = true;
    } else if (!hasDigit && /[0-9]/.test(char)) {
      hasDigit = true;
    } else if (!hasPunctuation && /[!@#$%^&*()-_=+[\]{}|;:,.<>?]/.test(char)) {
      hasPunctuation = true;
    }

    result += char;
  }

  
  if (!(hasLowercase && hasUppercase && hasDigit && hasPunctuation)) {
    
    return bytesToMoreSpecialString(bytes);
  }

  return result;
}

function bytesToNumericString(bytes) {
  let charset = '0123456789';
  let result = '';


  for (let i = 0; i < bytes.words.length * 4; i++) {
    let byte = (bytes.words[Math.floor(i / 4)] >> (24 - (i % 4) * 8)) & 0xff;
    let char = charset.charAt(byte % charset.length);

    result += char;
  }
  return result;
}


    function generateKey() {
      let webAddress = document.getElementById("webAddress").value;
      let password = document.getElementById("password").value;
      let iterationCount = document.getElementById("iterationCount").value;
      let salt = document.getElementById("salt").value;
      let length = document.getElementById("length").value;

      let key = generateRandomPasswordKey(webAddress, password, iterationCount, salt, length);

      copyToClipboard(key);

      document.getElementById("webAddress").value = "";
      document.getElementById("password").value = "";
      document.getElementById("iterationCount").value = "10000";
      document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
      document.getElementById("length").value = "21";

      showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
    }

    function generateLetterKey() {
      let webAddress = document.getElementById("webAddress").value;
      let password = document.getElementById("password").value;
      let iterationCount = document.getElementById("iterationCount").value;
      let salt = document.getElementById("salt").value;
      let length = document.getElementById("length").value;

      let key = generateRandomLetterKey(webAddress, password, iterationCount, salt, length);

      copyToClipboard(key);

      document.getElementById("webAddress").value = "";
      document.getElementById("password").value = "";
      document.getElementById("iterationCount").value = "10000";
      document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
      document.getElementById("length").value = "21";

      showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
    }

    function generateNumberKey() {
      let webAddress = document.getElementById("webAddress").value;
      let password = document.getElementById("password").value;
      let iterationCount = document.getElementById("iterationCount").value;
      let salt = document.getElementById("salt").value;
      let length = document.getElementById("length").value;

      let key = generateRandomNumberKey(webAddress, password, iterationCount, salt, length);

      copyToClipboard(key);

      document.getElementById("webAddress").value = "";
      document.getElementById("password").value = "";
      document.getElementById("iterationCount").value = "10000";
      document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
      document.getElementById("length").value = "21";

      showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
    }

    function generateMixedKey() {
      let webAddress = document.getElementById("webAddress").value;
      let password = document.getElementById("password").value;
      let iterationCount = document.getElementById("iterationCount").value;
      let salt = document.getElementById("salt").value;
      let length = document.getElementById("length").value;

      let key = generateRandomMixedKey(webAddress, password, iterationCount, salt, length);

      copyToClipboard(key);

      document.getElementById("webAddress").value = "";
      document.getElementById("password").value = "";
      document.getElementById("iterationCount").value = "10000";
      document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
      document.getElementById("length").value = "21";

      showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
    }

    function generateSpecialKey() {
      let webAddress = document.getElementById("webAddress").value;
      let password = document.getElementById("password").value;
      let iterationCount = document.getElementById("iterationCount").value;
      let salt = document.getElementById("salt").value;
      let length = document.getElementById("length").value;

      let key = generateRandomSpecialKey(webAddress, password, iterationCount, salt, length);

      copyToClipboard(key);

      document.getElementById("webAddress").value = "";
      document.getElementById("password").value = "";
      document.getElementById("iterationCount").value = "10000";
      document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
      document.getElementById("length").value = "21";

      showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
    }

    function encryptText() {
      let plaintext = document.getElementById("plaintext").value;
      let encryptionPassword = document.getElementById("encryptionPassword").value;

      let encrypted = CryptoJS.AES.encrypt(plaintext, encryptionPassword).toString();
      document.getElementById("encryptedText").value = encrypted;
      showAlert("Text encrypted successfully.", "success", document.getElementById("encryptionAlertContainer"));
    }

    function copyEncryptedText() {
      let encryptedText = document.getElementById("encryptedText").value;
      copyToClipboard(encryptedText);
      showAlert("Encrypted text copied to clipboard.", "success", document.getElementById("encryptionAlertContainer"));
    }

    function decryptText() {
        let encryptedText = document.getElementById("encryptedText").value;
        let decryptionPassword = document.getElementById("decryptionPassword").value;
        let alertContainer = document.getElementById("decryptionAlertContainer");
        
        try {
            let decrypted = CryptoJS.AES.decrypt(encryptedText, decryptionPassword).toString(CryptoJS.enc.Utf8);
            if (decrypted) {
            document.getElementById("plaintext").value = decrypted;
            showAlert("Text decrypted successfully.", "success", alertContainer);
            } else {
            showAlert("Decryption failed: incorrect password.", "danger", alertContainer);
            }
        } catch (error) {
            showAlert("Decryption failed. Please check your password and try again.", "danger", alertContainer);
        }
    }


    function copyDecryptedText() {
      let plaintext = document.getElementById("plaintext").value;
      copyToClipboard(plaintext);
      showAlert("Decrypted text copied to clipboard.", "alert-success", document.getElementById("decryptionAlertContainer"));
    }

    function copyToClipboard(text) {
      let input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }

    function showAlert(message, alertType, container) {
        let alertElement = document.createElement("div");
        alertElement.className = "alert alert-" + alertType + " alert-dismissible fade show";
        alertElement.role = "alert";
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        `;
        container.prepend(alertElement);

        setTimeout(function() {
            $(alertElement).alert('close');
        }, 3000);
    }



function generate() {
      var base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; 
      var randomValues = new Uint8Array(40); 
      window.crypto.getRandomValues(randomValues);
      
      var result = '';
      for (var i = 0; i < 32; i++) {
        result += base32Chars.charAt(randomValues[i] % 32);
      }
      document.getElementById('result').value = result;
}

function generateWithMaster() {
  var input = document.getElementById('password').value;
  var base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; 
  
  
  if (input != "") {
  while (input.length < 32) {
    input += input; 
  }
  input = input.slice(0, 32); 
  }
  else {
    alert("Master key input field cannot be empty.")
  }
  
  
  var base64 = btoa(input);

  
  var result = '';
  for (var i = 0; i < base64.length; i++) {
    var char = base64.charAt(i);
    if (char !== '=') {
      var index = char.charCodeAt(0);
      if (index === 43) index = 62; 
      else if (index === 47) index = 63; 
      result += base32Chars[index >> 2]; 
      result += base32Chars[((index & 0x03) << 3) | (base64.charCodeAt(++i) >> 5)]; 
      result += base32Chars[base64.charCodeAt(i) & 0x1F]; 
    }
  }

  
  result = result.slice(0, 32);

  document.getElementById('salt').value = result;

  document.getElementById('keyGeneratorForm').addEventListener('submit', function(event) {
 
  event.preventDefault();
  
  });

}

function copyToSalt() {
    var resultInput = document.getElementById('result');
    var saltinput = document.getElementById('salt');
    saltinput.value = resultInput.value;
}


function showMaster() {
    var passwordinput = document.getElementById('password');
    var showbutton = document.getElementById('showbutton');
    if (passwordinput.type == "password"){
      showbutton.innerHTML = "Hide";
      passwordinput.setAttribute('type', 'text');
    }
    else {
      showbutton.innerHTML = "Show";
      passwordinput.setAttribute('type', 'password');
    }
}




if ('serviceWorker' in navigator) {
window.addEventListener('load', function() {
  navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
    console.log('ServiceWorker registration successful with scope: ', registration.scope);
  }, function(err) {
    console.error('ServiceWorker registration failed: ', err);
  });
});
}

document.getElementById('downloadButton').addEventListener('click', function() {
if ('serviceWorker' in navigator && 'caches' in window) {
  
  if (confirm('Do you want to download resources for offline use?')) {
   
    caches.open('key-generator-cache-v1').then(function(cache) {
      cache.addAll([
        '/',
        'bootstrap.min.css',
        'keygen_styles.css',
        'bootstrap.bundle.min.js',
        'jquery.min.js',
        'jquery-3.5.1.min.js',
        'crypto-js.min.js',
        'carrypass.js',
       
      ]).then(function() {
        alert('Resources downloaded successfully for offline use.');
      }).catch(function(error) {
        console.error('Cache error:', error);
      });
    });
  }
} else {
  alert('Offline functionality is not supported on this browser.');
}
});


document.getElementById('usecase').addEventListener('click', function() {
var explanation = document.getElementById('explanation');
if (explanation.style.display === 'none') {
  explanation.style.display = 'block';
} else {
  explanation.style.display = 'none';
}
});


async function encryptFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function() {
      const fileData = reader.result;
      const password = document.getElementById('password1').value;

      const salt = new TextEncoder().encode('MyFixedSalt');
      const iv = new TextEncoder().encode('MyFixedIV');
      const keyMaterial = await window.crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(password),
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
      );

      const derivedKey = await window.crypto.subtle.deriveKey(
          {
              name: 'PBKDF2',
              salt,
              iterations: 100000,
              hash: 'SHA-256'
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
      );

      const encryptedData = await window.crypto.subtle.encrypt(
          {
              name: 'AES-GCM',
              iv
          },
          derivedKey,
          fileData
      );

      const encryptedBlob = new Blob([encryptedData], { type: file.type });
      const encryptedFileName = file.name.replace(/\.[^/.]+$/, '') + '[encrypted]' + file.name.substring(file.name.lastIndexOf('.'));
      const encryptedUrl = URL.createObjectURL(encryptedBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = encryptedUrl;
      downloadLink.download = encryptedFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
  };

  reader.readAsArrayBuffer(file);
}

async function decryptFile() {
  const encryptedFileInput = document.getElementById('encryptedFileInput');
  const encryptedFile = encryptedFileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function() {
      const encryptedFileData = reader.result;
      const password = document.getElementById('password2').value;

      const salt = new TextEncoder().encode('MyFixedSalt');
      const iv = new TextEncoder().encode('MyFixedIV');
      const keyMaterial = await window.crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(password),
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
      );

      const derivedKey = await window.crypto.subtle.deriveKey(
          {
              name: 'PBKDF2',
              salt,
              iterations: 100000,
              hash: 'SHA-256'
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
      );

      const decryptedData = await window.crypto.subtle.decrypt(
          {
              name: 'AES-GCM',
              iv
          },
          derivedKey,
          encryptedFileData
      );

      const decryptedBlob = new Blob([decryptedData], { type: encryptedFile.type });
      const decryptedFileName = encryptedFile.name.replace(/\.[^/.]+$/, '') + '[decrypted]' + encryptedFile.name.substring(encryptedFile.name.lastIndexOf('.'));
      const decryptedUrl = URL.createObjectURL(decryptedBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = decryptedUrl;
      downloadLink.download = decryptedFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
  };

  reader.readAsArrayBuffer(encryptedFile);
}


function updateFileName(inputId) {
    const fileInput = document.getElementById(inputId);
    const fileName = fileInput.files[0].name;
    const label = document.getElementById(inputId + 'Label');
    label.innerText = fileName;
}



document.addEventListener("DOMContentLoaded", function() {
const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(function(navLink) {
  navLink.addEventListener("click", function() {
    const navbarCollapse = document.querySelector(".navbar-collapse");
    if (navbarCollapse.classList.contains("show")) {
      navbarCollapse.classList.remove("show");
    }
  });
});
});
