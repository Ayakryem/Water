// 1. הכתובת של ה-Firebase שלך (וודאי שזו הכתובת הממשית שלך)
const FIREBASE_URL = "https://watertracker-51bc0-default-rtdb.firebaseio.com/";

let db = null;
try {
    firebase.initializeApp({ databaseURL: FIREBASE_URL });
    db = firebase.database();
} catch (e) {
    console.error("שגיאה בהתחברות ל-Firebase:", e);
}

let currentWater = 0;
let dailyGoal = 2000;
let history = [];
const todayKey = new Date().toISOString().slice(0, 10);

// הפעלת האפליקציה באופן מיידי
initApp();

// טעינת הנתונים והאזנה לשינויים בזמן אמת בענן
function initApp() {
    if (db) {
        db.ref(`users/default_user/${todayKey}`).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                currentWater = data.currentWater || 0;
                dailyGoal = data.dailyGoal || 2000;
                history = data.history || [];
                document.getElementById('goalInput').value = dailyGoal;
            }
            updateUI();
        });
    } else {
        updateUI();
    }
}

// שמירת הנתונים ב-Firebase
function saveData() {
    if (db) {
        db.ref(`users/default_user/${todayKey}`).set({
            currentWater: currentWater,
            dailyGoal: dailyGoal,
            history: history
        });
    }
}

// הוספת מים
function addWater(amount) {
    currentWater += amount;
    const now = new Date();
    const timeString = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    history.unshift({
        id: Date.now(),
        amount: amount,
        time: timeString
    });

    saveData();
    updateUI();
}

// מחיקת פריט מההיסטוריה
function deleteHistoryItem(id) {
    const itemIndex = history.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
        currentWater -= history[itemIndex].amount;
        if (currentWater < 0) currentWater = 0;
        history.splice(itemIndex, 1);
        saveData();
        updateUI();
    }
}

// עדכון יעד יומי
document.getElementById('goalInput').addEventListener('change', (e) => {
    dailyGoal = parseInt(e.target.value) || 2000;
    saveData();
    updateUI();
});

// עדכון התצוגה בעמוד
function updateUI() {
    document.getElementById('currentAmount').innerText = `${currentWater} / ${dailyGoal} מ"ל`;
    const percent = Math.min(Math.round((currentWater / dailyGoal) * 100), 100);
    document.getElementById('percentage').innerText = `${percent}% מהיעד`;
    document.getElementById('waterFill').style.height = `${percent}%`;

    const historyList = document.getElementById('historyList');
    if (history.length === 0) {
        historyList.innerHTML = '<li class="empty-history">עוד לא שתית היום, זה הזמן לכוס מים!</li>';
    } else {
        historyList.innerHTML = history.map(item => `
            <li class="history-item">
                <span><strong>${item.amount} מ"ל</strong> בשעה ${item.time}</span>
                <button class="delete-btn" onclick="deleteHistoryItem(${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </li>
        `).join('');
    }
}
