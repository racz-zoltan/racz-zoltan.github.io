
    
    function generateRandomPasswordKey(webAddress, password, iterationCount, salt, length) {
      let inputStr = webAddress + password;

      let iterations = iterationCount;
      let hashBytes = CryptoJS.PBKDF2(inputStr, salt, { keySize: length/4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });

      let encodedString = bytesToAlphaNumericString(hashBytes, password);
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

      let encodedString = bytesToNumericAlphaString(hashBytes);
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
  let charset = 's5zX7K9tHy5CkE2I8RvQcYfOu1M8Wr42eG3gZxDq6aFbhT4jJi3LN0lAUpP7nwB6VdoS';
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

function bytesToNumericAlphaString(bytes) {
  let charset = 'n0tHyaFX4GvE3IZ2qYf8WP1cKuC5s7Bw6jJi3L9RzDaVQp7oYlAM86gSdE42rXbKTU9x5ZDfGq1eC';
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
   
    return bytesToNumericAlphaString(bytes);
  }

  return result;
}

function bytesToAlphaString(bytes) {
  let charset = 'cOpMniQyTmSvwklVJuIjgKtNrLEoRhXYZqaxiHdsPWzDfUeGbAFB';
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
  let charset = 'QP}v7$D6{+[(Cw^,e5&@uB^Jq.]Gd4=VLuPYN5o;Hk*WgF_a4Xh!lbczr8]Z2Iy9(R03N-1tA<EjSM|)iOT2sfxK>mU1%`:n?';
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
  let charset = '7294053861';
  let result = '';


  for (let i = 0; i < bytes.words.length * 4; i++) {
    let byte = (bytes.words[Math.floor(i / 4)] >> (24 - (i % 4) * 8)) & 0xff;
    let char = charset.charAt(byte % charset.length);

    result += char;
  }
  return result;
}


function generateKey() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  let webAddress = document.getElementById("webAddress").value;
  let password = document.getElementById("password").value;
  let iterationCount = document.getElementById("iterationCount").value;
  let salt = document.getElementById("salt").value;
  let length = document.getElementById("length").value;

  let key = generateRandomPasswordKey(webAddress, password, iterationCount, salt, length);

  copyToClipboard(key);

  document.getElementById("webAddress").value = "";
  document.getElementById("password").value = "";
  document.getElementById("iterationCount").value = "21000";
  document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
  document.getElementById("length").value = "21";

  showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));

  updateCounter();

}

function generateAlphaNumKey() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  let webAddress = document.getElementById("webAddress").value;
  let password = document.getElementById("password").value;
  let iterationCount = document.getElementById("iterationCount").value;
  let salt = document.getElementById("salt").value;
  let length = document.getElementById("length").value;

  let key = generateRandomMixedKey(webAddress, password, iterationCount, salt, length);

  copyToClipboard(key);

  document.getElementById("webAddress").value = "";
  document.getElementById("password").value = "";
  document.getElementById("iterationCount").value = "21000";
  document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
  document.getElementById("length").value = "21";

  showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));

  updateCounter();

}

function generateLetterKey() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  let webAddress = document.getElementById("webAddress").value;
  let password = document.getElementById("password").value;
  let iterationCount = document.getElementById("iterationCount").value;
  let salt = document.getElementById("salt").value;
  let length = document.getElementById("length").value;

  let key = generateRandomLetterKey(webAddress, password, iterationCount, salt, length);

  copyToClipboard(key);

  document.getElementById("webAddress").value = "";
  document.getElementById("password").value = "";
  document.getElementById("iterationCount").value = "21000";
  document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
  document.getElementById("length").value = "21";

  showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
  updateCounter();
}

function generateNumberKey() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  let webAddress = document.getElementById("webAddress").value;
  let password = document.getElementById("password").value;
  let iterationCount = document.getElementById("iterationCount").value;
  let salt = document.getElementById("salt").value;
  let length = document.getElementById("length").value;

  let key = generateRandomNumberKey(webAddress, password, iterationCount, salt, length);

  copyToClipboard(key);

  document.getElementById("webAddress").value = "";
  document.getElementById("password").value = "";
  document.getElementById("iterationCount").value = "21000";
  document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
  document.getElementById("length").value = "21";

  showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
  updateCounter();
}

function generateMixedKey() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  let webAddress = document.getElementById("webAddress").value;
  let password = document.getElementById("password").value;
  let iterationCount = document.getElementById("iterationCount").value;
  let salt = document.getElementById("salt").value;
  let length = document.getElementById("length").value;

  let key = generateRandomMixedKey(webAddress, password, iterationCount, salt, length);

  copyToClipboard(key);

  document.getElementById("webAddress").value = "";
  document.getElementById("password").value = "";
  document.getElementById("iterationCount").value = "21000";
  document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
  document.getElementById("length").value = "21";

  showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
  updateCounter();
}


function generateSpecialKey() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  let webAddress = document.getElementById("webAddress").value;
  let password = document.getElementById("password").value;
  let iterationCount = document.getElementById("iterationCount").value;
  let salt = document.getElementById("salt").value;
  let length = document.getElementById("length").value;

  let key = generateRandomSpecialKey(webAddress, password, iterationCount, salt, length);

  copyToClipboard(key);

  document.getElementById("webAddress").value = "";
  document.getElementById("password").value = "";
  document.getElementById("iterationCount").value = "21000";
  document.getElementById("salt").value = "KDV4ETAMVQB5FCEIXUKWT7V6ZFYVW7H5";
  document.getElementById("length").value = "21";

  showAlert("Password copied to clipboard.", "success", document.getElementById("keyGeneratorAlertContainer"));
  updateCounter();
}

function encryptText() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  let plaintext = document.getElementById("plaintext").value;
  let encryptionPassword = document.getElementById("encryptionPassword").value;

  if (encryptionPassword != ""){
  let encrypted = CryptoJS.AES.encrypt(plaintext, encryptionPassword).toString();
  document.getElementById("encryptedText").value = encrypted;
  document.getElementById("plaintext").value = "";
  document.getElementById("encryptionPassword").value = "";
  showAlert("Text encrypted successfully. See 'Encrypted Text' field", "success", document.getElementById("encryptionAlertContainer"));
  }
  else {
    showModal("Password input field cannot be empty.");
  }
  updateCounter();
}

function copyEncryptedText() {
  let encryptedText = document.getElementById("encryptedText").value;
  copyToClipboard(encryptedText);
  showAlert("Encrypted text copied to clipboard.", "success", document.getElementById("encryptionAlertContainer"));
}

function decryptText() {
    if (isRateLimited()) {
      showModal("You have exceeded the rate limit. Please try again later.");
      return;
    }
    let encryptedText = document.getElementById("encryptedText").value;
    let decryptionPassword = document.getElementById("decryptionPassword").value;
    let alertContainer = document.getElementById("decryptionAlertContainer");


    if (decryptionPassword != ""){
    try {
        let decrypted = CryptoJS.AES.decrypt(encryptedText, decryptionPassword).toString(CryptoJS.enc.Utf8);
        if (decrypted) {
        document.getElementById("plaintext").value = decrypted;
        document.getElementById("encryptedText").value = "";
        document.getElementById("decryptionPassword").value = "";
        showAlert("Text decrypted successfully. See 'Text to Encrypt' field", "success", alertContainer);
        updateCounter();
        } else {
        showAlert("Decryption failed: incorrect password.", "danger", alertContainer);
        updateCounter();
        }
    } catch (error) {
        showAlert("Decryption failed. Please check your password and try again.", "danger", alertContainer);
    }
  }
  else {
    showModal("Password input field cannot be empty.");
  }
  updateCounter();
}


function copyDecryptedText() {
  let plaintext = document.getElementById("plaintext").value;
  let alertContainer = document.getElementById("decryptionAlertContainer");
  copyToClipboard(plaintext);
  showAlert("Decrypted text copied to clipboard.", "success", alertContainer);
}


async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    showModal('Failed to copy text to clipboard.');
    console.error('Failed to copy text to clipboard:', err);
  }
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
  var webAddress = document.getElementById('webAddress').value;
  var password = document.getElementById('password').value;
  let alertContainer = document.getElementById("keyGeneratorAlertContainer");
  var input = webAddress+password
  var base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; 
  
  
  if ((webAddress != "") && (password != "")) {
  while (input.length < 32) {
    input += input; 
  }
  input = input.slice(0, 32); 
  }
  else {
    showAlert("Website name and Master password input fields cannot be empty.", "danger", alertContainer);
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

// EARLY VERSION
// document.getElementById('downloadButton').addEventListener('click', function() {
// if ('serviceWorker' in navigator && 'caches' in window) {
  
//   if (confirm('Do you want to download resources for offline use?')) {
   
//     caches.open('key-generator-cache-v1').then(function(cache) {
//       cache.addAll([
//         '/',
//         'bootstrap.min.css',
//         'keygen_styles.css',
//         'bootstrap.bundle.min.js',
//         'jquery.min.js',
//         'jquery-3.5.1.min.js',
//         'crypto-js.min.js',
//         'carrypass.js',
       
//       ]).then(function() {
//         alert('Resources downloaded successfully for offline use.');
//       }).catch(function(error) {
//         console.error('Cache error:', error);
//       });
//     });
//   }
// } else {
//   alert('Offline functionality is not supported on this browser.');
// }
// });


document.getElementById('downloadButton').addEventListener('click', function() {
  if ('serviceWorker' in navigator && 'caches' in window) {
    showModalWorker('Do you want to download resources for offline use?', function(confirmed) {
      if (confirmed) {
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
            showModal("Resources downloaded successfully for offline use.");
          }).catch(function(error) {
            console.error('Cache error:', error);
          });
        });
      }
    });
  } else {
    showModal("Offline functionality is not supported on this browser.");
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


function generateAesVector(password) {
  var input = password
  var base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; 
  
  if (password != "") {
  while (input.length < 32) {
    input += input; 
  }
  input = input.slice(0, 32); 
  }
  else {
    showModal("Password input field cannot be empty.");

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

  return result;

}


function generateAesSalt(password) {
  var input = password
  var base32Chars = '8JKLM2PQRY9Z5VWX67SNTU3BCDEFGHO4A'; 
  
  
  if (password != "") {
  while (input.length < 32) {
    input += input; 
  }
  input = input.slice(0, 32); 
  }
  else {

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

  return result;

}


async function encryptFile() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const reader = new FileReader();
  

  reader.onload = async function() {
      const fileData = reader.result;
      const password = document.getElementById('password1').value;
      var myFixedIV = generateAesVector(password);
      var myFixedSalt = generateAesSalt(password);

      const salt = new TextEncoder().encode(myFixedSalt);
      const iv = new TextEncoder().encode(myFixedIV);
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

      document.getElementById('fileInputLabel').innerHTML = "Choose file";
      document.getElementById('password1').value = "";

  };


  reader.readAsArrayBuffer(file);
  updateCounter();
}


async function decryptFile() {
  if (isRateLimited()) {
    showModal("You have exceeded the rate limit. Please try again later.");
    return;
  }
  const encryptedFileInput = document.getElementById('encryptedFileInput');
  const encryptedFile = encryptedFileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function() {
      const encryptedFileData = reader.result;
      const password = document.getElementById('password2').value;
      var myFixedIV = generateAesVector(password);
      var myFixedSalt = generateAesSalt(password);

      const salt = new TextEncoder().encode(myFixedSalt);
      const iv = new TextEncoder().encode(myFixedIV);
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

      document.getElementById('encryptedFileInputLabel').innerHTML = "Choose file";
      document.getElementById('password2').value = "";

  };

  reader.readAsArrayBuffer(encryptedFile);
  updateCounter();
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


const MAX_CALLS_PER_MINUTE = 7;
const RATE_LIMIT_WINDOW = 60 * 1000; 


let callTimes = [];


function isRateLimited() {
    const currentTime = Date.now();
   
    callTimes = callTimes.filter(time => (currentTime - time) < RATE_LIMIT_WINDOW);
    return callTimes.length >= MAX_CALLS_PER_MINUTE;
}


function updateCounter() {
    callTimes.push(Date.now());
}


function showModal(message) {
  const modal = document.getElementById('alertModal');
  const modalMessage = document.getElementById('alertModalMessage');
  modalMessage.textContent = message;
  modal.style.display = 'block';

  const closeButton = document.getElementsByClassName('close')[0];
  closeButton.onclick = function() {
    modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

function showModalWorker(message, callback) {
  const modal = document.getElementById('myModal');
  const modalMessage = document.getElementById('modalMessage');
  modalMessage.textContent = message;
  modal.style.display = 'block';

  const confirmButton = document.getElementById('modalConfirm');
  confirmButton.onclick = function() {
    modal.style.display = 'none';
    callback(true);
  };

  const cancelButton = document.getElementById('modalCancel');
  cancelButton.onclick = function() {
    modal.style.display = 'none';
    callback(false);
  };
}