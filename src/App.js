import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Music, Piano, UserCheck, UserX, TrendingUp, Play, FileText, Lock, Eye, EyeOff, Star, Target, Lightbulb } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

export default function MusicScheduleOptimizer() {

const timeSlots = {
'Lundi': { start: 12, end: 20 },
'Mardi': { start: 12, end: 18 },
'Jeudi': { start: 12, end: 18 },
'Samedi': { start: 8, end: 13 }
};

const [currentView, setCurrentView] = useState('student');
const [selectedStudent, setSelectedStudent] = useState('');
const [selectedSlots, setSelectedSlots] = useState([]);
const [hasSubmitted, setHasSubmitted] = useState(false);
const [optimizationCompleted, setOptimizationCompleted] = useState(false);
const [finalSchedule, setFinalSchedule] = useState([]);
const [isOptimizing, setIsOptimizing] = useState(false);
const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
const [teacherPassword, setTeacherPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [loginError, setLoginError] = useState('');
const [availableSlots, setAvailableSlots] = useState([]);
const [inscriptions, setInscriptions] = useState([]);
const [students, setStudents] = useState([]);
const [studentPreferences, setStudentPreferences] = useState({});

useEffect(() => {
  const fetchInscriptions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'preferences'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInscriptions(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des inscriptions :", error);
    }
  };

  if (isTeacherLoggedIn) {
    fetchInscriptions();
  }
}, [isTeacherLoggedIn]);

const TEACHER_PASSWORD = 'musique2025';

const handleTeacherLogin = () => {
if (teacherPassword === TEACHER_PASSWORD) {
setIsTeacherLoggedIn(true);
setLoginError('');
setTeacherPassword('');
} else {
setLoginError('Mot de passe incorrect');
setTimeout(() => setLoginError(''), 3000);
}
};

const handleTeacherLogout = () => {
setIsTeacherLoggedIn(false);
setCurrentView('student');
};

const generateTimeSlots = (duration) => {
const slots = [];
Object.entries(timeSlots).forEach(([day, hours]) => {
for (let hour = hours.start; hour <= hours.end - (duration / 60); hour++) {
for (let minute = 0; minute < 60; minute += 15) {
if (hour + (minute + duration) / 60 <= hours.end) {
const startTime = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
const endHour = Math.floor((hour * 60 + minute + duration) / 60);
const endMinute = (hour * 60 + minute + duration) % 60;
const endTime = endHour.toString().padStart(2, '0') + ':' + endMinute.toString().padStart(2, '0');
slots.push({
id: day + '-' + startTime + '-' + duration,
day,
startTime,
endTime,
duration,
display: day + ' ' + startTime + '-' + endTime
});
}
}
}
});
return slots;
};

const getStudentDuration = (studentName) => {
const student = students.find(s => s.name === studentName);
return student ? student.duration : 30;
};

useEffect(() => {
const fetchStudents = async () => {
  const snapshot = await getDocs(collection(db, "students"));
  const list = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setStudents(list);
};
fetchStudents();
}, []);

useEffect(() => {
const fetchPreferences = async () => {
  const snapshot = await getDocs(collection(db, "preferences"));
  const prefs = {};
  snapshot.forEach(doc => {
    prefs[doc.id] = doc.data();
  });
  setStudentPreferences(prefs);
};
fetchPreferences();
}, []);

useEffect(() => {
if (selectedStudent) {
const duration = getStudentDuration(selectedStudent);
setAvailableSlots(generateTimeSlots(duration));
setSelectedSlots([]);
setHasSubmitted(!!studentPreferences[selectedStudent]);
}
}, [selectedStudent, studentPreferences]);

const handleSlotSelection = (slot) => {
if (hasSubmitted) return;

if (selectedSlots.find(s => s.id === slot.id)) {
setSelectedSlots(selectedSlots.filter(s => s.id !== slot.id));
} else if (selectedSlots.length < 4) {
setSelectedSlots([...selectedSlots, slot]);
}
};

const saveStudentPreferences = async () => {
  if (selectedStudent && selectedSlots.length === 4 && !hasSubmitted) {
    const duration = getStudentDuration(selectedStudent);

    try {
      await setDoc(doc(db, "preferences", selectedStudent), {
        name: selectedStudent,
        duration,
        slots: selectedSlots,
        timestamp: new Date().toISOString()
      });

      setStudentPreferences(prev => ({
        ...prev,
        [selectedStudent]: {
          duration,
          slots: selectedSlots,
          timestamp: new Date().toISOString()
        }
      }));

      setHasSubmitted(true);
      alert('Préférences enregistrées avec succès dans Firestore !');
    } catch (error) {
      console.error("Erreur Firestore :", error);
      alert("Erreur lors de l'enregistrement. Vérifie ta connexion.");
    }
  }
};

const runGlobalOptimization = () => {
setIsOptimizing(true);

setTimeout(() => {
const studentsEntries = Object.entries(studentPreferences);
if (studentsEntries.length === 0) {
setIsOptimizing(false);
return;
}

const slotsOverlap = (slot1, slot2) => {
if (slot1.day !== slot2.day) return false;
const start1 = parseInt(slot1.startTime.replace(':', ''));
const end1 = parseInt(slot1.endTime.replace(':', ''));
const start2 = parseInt(slot2.startTime.replace(':', ''));
const end2 = parseInt(slot2.endTime.replace(':', ''));
return !(end1 <= start2 || end2 <= start1);
};

const optimizeSchedule = () => {
const assignments = [];
const usedSlots = [];

studentsEntries.forEach(([studentName, prefs]) => {
let assigned = false;
for (let i = 0; i < prefs.slots.length; i++) {
const slot = prefs.slots[i];
const hasConflict = usedSlots.some(usedSlot => slotsOverlap(slot, usedSlot));

if (!hasConflict) {
assignments.push({
student: studentName,
slot: slot,
duration: prefs.duration,
preferenceRank: i + 1,
preferences: prefs.slots
});
usedSlots.push(slot);
assigned = true;
break;
}
}

if (!assigned) {
assignments.push({
student: studentName,
slot: null,
duration: prefs.duration,
status: 'conflit',
preferences: prefs.slots
});
}
});

return assignments;
};

const optimizedSchedule = optimizeSchedule();
setFinalSchedule(optimizedSchedule);
setOptimizationCompleted(true);
setIsOptimizing(false);
}, 2000);
};

const organizeScheduleByTime = (assignments) => {
const organized = {};

assignments.forEach(assignment => {
if (assignment.slot) {
const day = assignment.slot.day;
if (!organized[day]) organized[day] = [];
organized[day].push(assignment);
}
});

Object.keys(organized).forEach(day => {
organized[day].sort((a, b) => {
return a.slot.startTime.localeCompare(b.slot.startTime);
});
});

return organized;
};

const organizedSchedule = organizeScheduleByTime(finalSchedule);

const totalResponses = Object.keys(studentPreferences).length;
const successfulAssignments = finalSchedule.filter(a => a.slot).length;
const conflicts = finalSchedule.filter(a => a.status === 'conflit').length;
const satisfactionScore = finalSchedule.reduce((score, assignment) => {
if (assignment.preferenceRank) {
return score + (5 - assignment.preferenceRank);
}
return score;
}, 0);
const maxPossibleScore = totalResponses * 4;
const satisfactionPercentage = totalResponses > 0 ? Math.round((satisfactionScore / maxPossibleScore) * 100) : 0;

return (
<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
<div className="relative">
<div className="h-52 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
<div className="absolute inset-0 opacity-20">
<div className="absolute top-6 left-12 transform rotate-12 animate-bounce">
<Music className="w-20 h-20 text-white" />
</div>
<div className="absolute top-8 right-20 transform -rotate-12 animate-pulse">
<Piano className="w-16 h-16 text-white" />
</div>
<div className="absolute bottom-8 left-1/4 transform rotate-45 animate-bounce" style={{animationDelay: '0.5s'}}>
<Music className="w-12 h-12 text-white" />
</div>
<div className="absolute bottom-6 right-1/3 transform -rotate-12 animate-pulse" style={{animationDelay: '1s'}}>
<Piano className="w-10 h-10 text-white" />
</div>
</div>

<div className="relative z-10 h-full flex items-center justify-between px-8">
<div className="flex items-center gap-6">
<div className="bg-white/25 backdrop-blur-sm p-5 rounded-full border border-white/30 shadow-lg">
<Piano className="w-10 h-10 text-white" />
</div>
<div className="text-white">
<h1 className="text-4xl font-bold tracking-tight">PlanningMaster Pro</h1>
<p className="text-indigo-100 font-medium text-lg">Gestion optimisée des créneaux</p>
</div>
</div>

<div className="text-right text-white">
<p className="text-2xl font-semibold">Sophie Lemarchand</p>
<p className="text-indigo-100 text-lg">Professeure de Piano</p>
<p className="text-sm text-indigo-200">Année 2025/2026</p>
</div>
</div>
</div>

<div className="absolute bottom-0 left-0 right-0">
<svg viewBox="0 0 1200 120" fill="none" className="w-full h-auto">
<path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="white"/>
</svg>
</div>
</div>

<div className="relative z-20 -mt-16 px-4 pb-6">
<div className="max-w-7xl mx-auto">
<div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">

<div className="flex gap-4 mb-8 flex-wrap">
<button
onClick={() => setCurrentView('student')}
className={'px-8 py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 ' +
(currentView === 'student'
? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl'
: 'bg-gray-100 text-gray-600 hover:bg-gray-200')
}
>
<Users className="w-5 h-5 inline mr-3" />
Interface Élève
</button>

{!isTeacherLoggedIn ? (
<button
onClick={() => setCurrentView('login')}
className={'px-8 py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 ' +
(currentView === 'login'
? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-xl'
: 'bg-gray-100 text-gray-600 hover:bg-gray-200')
}
>
<Lock className="w-5 h-5 inline mr-3" />
Accès Professeur
</button>
) : (
<>
<button
onClick={() => setCurrentView('admin')}
className={'px-8 py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 ' +
(currentView === 'admin'
? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl'
: 'bg-gray-100 text-gray-600 hover:bg-gray-200')
}
>
<Calendar className="w-5 h-5 inline mr-3" />
Dashboard Professeur
</button>
{optimizationCompleted && (
<button
onClick={() => setCurrentView('planning')}
className={'px-8 py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 ' +
(currentView === 'planning'
? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl'
: 'bg-gray-100 text-gray-600 hover:bg-gray-200')
}
>
<FileText className="w-5 h-5 inline mr-3" />
Planning Final
</button>
)}
<button
onClick={handleTeacherLogout}
className="px-6 py-4 rounded-2xl font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-all"
>
Déconnexion
</button>
</>
)}
</div>

{currentView === 'student' && (
<div className="space-y-8">
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-200">
<h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
<Piano className="w-6 h-6 text-indigo-600" />
Réservation des créneaux de cours
</h3>

{!optimizationCompleted ? (
<div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
<p className="text-blue-800 font-medium">
📝 Phase de collecte des préférences en cours. Aucune attribution immédiate.
</p>
</div>
) : (
<div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
<p className="text-green-800 font-medium">
✅ Optimisation terminée ! Consultez votre créneau attribué.
</p>
</div>
)}

<div className="mb-8">
<label className="block text-lg font-semibold text-gray-700 mb-3">
Sélectionner l'élève
</label>
<select
value={selectedStudent}
onChange={(e) => setSelectedStudent(e.target.value)}
className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:ring-3 focus:ring-indigo-500 focus:border-transparent transition-all"
disabled={optimizationCompleted}
>
<option value="">Choisir un élève...</option>
{students.map((student, index) => (
<option key={index} value={student.name}>
{student.name} - {student.duration} minutes
{studentPreferences[student.name] ? ' - Inscrit' : ''}
</option>
))}
</select>
</div>

{selectedStudent && !optimizationCompleted && (
<div>
<div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
<div className="flex items-center justify-between">
<p className="text-blue-800 font-medium">
<Clock className="w-5 h-5 inline mr-2" />
Durée du cours : <strong>{getStudentDuration(selectedStudent)} minutes</strong>
</p>
{hasSubmitted && (
<span className="text-green-600 font-semibold flex items-center gap-2">
<CheckCircle className="w-5 h-5" />
Inscrit
</span>
)}
</div>
</div>

{hasSubmitted ? (
<div className="p-6 bg-green-50 border border-green-200 rounded-xl">
<h4 className="font-bold text-green-800 mb-3 text-lg">Vos préférences enregistrées :</h4>
<div className="space-y-2">
{studentPreferences[selectedStudent] && studentPreferences[selectedStudent].slots.map((slot, index) => (
<div key={index} className="text-green-700 bg-white p-3 rounded-lg border border-green-200">
<strong>{index + 1}.</strong> {slot.display}
</div>
))}
</div>
<p className="text-sm text-green-600 mt-4 font-medium">
✓ Inscription terminée - En attente de l'optimisation
</p>
</div>
) : (
<div>
<h4 className="font-bold text-gray-800 mb-4 text-lg">
Sélectionnez 4 créneaux par ordre de préférence ({selectedSlots.length}/4)
</h4>
<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-2">
{availableSlots.map((slot) => {
const isSelected = selectedSlots.find(s => s.id === slot.id);
const selectionIndex = selectedSlots.findIndex(s => s.id === slot.id);
return (
<button
key={slot.id}
onClick={() => handleSlotSelection(slot)}
disabled={!isSelected && selectedSlots.length >= 4}
className={'p-4 text-sm font-medium rounded-xl border transition-all transform hover:scale-105 relative ' +
(isSelected
? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-lg'
: selectedSlots.length >= 4
? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
: 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50')
}
>
{isSelected && (
<span className="absolute -top-2 -right-2 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
{selectionIndex + 1}
</span>
)}
{slot.display}
</button>
);
})}
</div>

{selectedSlots.length === 4 && (
<div className="mt-8 text-center">
<button
onClick={saveStudentPreferences}
className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-xl"
>
<CheckCircle className="w-6 h-6 inline mr-3" />
Valider mes 4 préférences
</button>
</div>
)}
</div>
)}
</div>
)}

{selectedStudent && optimizationCompleted && (
<div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
<h4 className="font-bold text-blue-800 mb-3 text-lg">Résultat de l'optimisation :</h4>
{(() => {
const assignment = finalSchedule.find(a => a.student === selectedStudent);
if (assignment && assignment.slot) {
return (
<div className="text-blue-700">
<p className="text-xl font-bold mb-2">✅ Créneau attribué : {assignment.slot.display}</p>
<p className="text-lg">Rang de préférence : <span className="font-semibold">{assignment.preferenceRank}er choix</span></p>
</div>
);
} else {
return (
<div className="text-red-700">
<p className="text-xl font-bold mb-2">⚠️ Conflit détecté</p>
<p className="text-lg">Contact direct nécessaire pour ce créneau.</p>
</div>
);
}
})()}
</div>
)}
</div>
</div>
)}

{currentView === 'login' && !isTeacherLoggedIn && (
<div className="max-w-lg mx-auto">
<div className="bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-2xl border border-red-200">
<h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
<Lock className="w-6 h-6 text-red-600" />
Accès Professeur Sécurisé
</h3>

<div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
<p className="text-yellow-800 font-medium">
🔒 Pour la démo, mot de passe : <strong>musique2025</strong>
</p>
</div>

<div className="space-y-6">
<div>
<label className="block text-lg font-semibold text-gray-700 mb-3">
Mot de passe
</label>
<div className="relative">
<input
type={showPassword ? 'text' : 'password'}
value={teacherPassword}
onChange={(e) => setTeacherPassword(e.target.value)}
onKeyPress={(e) => e.key === 'Enter' && handleTeacherLogin()}
className="w-full p-4 pr-12 text-lg border border-gray-300 rounded-xl focus:ring-3 focus:ring-red-500 focus:border-transparent transition-all"
placeholder="Entrez le mot de passe"
/>
<button
type="button"
onClick={() => setShowPassword(!showPassword)}
className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
>
{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
</button>
</div>
</div>

{loginError && (
<div className="p-4 bg-red-50 border border-red-200 rounded-xl">
<p className="text-red-700 font-medium">{loginError}</p>
</div>
)}

<button
onClick={handleTeacherLogin}
className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-xl"
>
<Lock className="w-5 h-5 inline mr-3" />
Se connecter
</button>
</div>
</div>
</div>
)}

{currentView === 'admin' && isTeacherLoggedIn && (
<div className="space-y-8">
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
<div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl text-white">
<div className="flex items-center justify-between">
<div>
<p className="text-green-100 font-medium">Inscrits</p>
<p className="text-3xl font-bold">{totalResponses}/32</p>
</div>
<UserCheck className="w-10 h-10 text-green-200" />
</div>
</div>
<div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-2xl text-white">
<div className="flex items-center justify-between">
<div>
<p className="text-orange-100 font-medium">En attente</p>
<p className="text-3xl font-bold">{32 - totalResponses}</p>
</div>
<UserX className="w-10 h-10 text-orange-200" />
</div>
</div>
<div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-2xl text-white">
<div className="flex items-center justify-between">
<div>
<p className="text-blue-100 font-medium">Satisfaction</p>
<p className="text-3xl font-bold">{satisfactionPercentage}%</p>
</div>
<Star className="w-10 h-10 text-blue-200" />
</div>
</div>
<div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-2xl text-white">
<div className="flex items-center justify-between">
<div>
<p className="text-purple-100 font-medium">Conflits</p>
<p className="text-3xl font-bold">{conflicts}</p>
</div>
<AlertCircle className="w-10 h-10 text-purple-200" />
</div>
</div>
</div>

<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200">
<h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
<Target className="w-6 h-6 text-blue-600" />
Gestion des Inscriptions
</h3>

<div className="mb-6">
<div className="flex items-center justify-between mb-4">
<p className="text-lg font-semibold text-gray-700">
Liste des élèves inscrits ({totalResponses})
</p>
{totalResponses > 0 && !optimizationCompleted && (
<button
onClick={runGlobalOptimization}
disabled={isOptimizing}
className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
>
{isOptimizing ? (
<div className="flex items-center gap-2">
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
Optimisation...
</div>
) : (
<div className="flex items-center gap-2">
<Play className="w-5 h-5" />
Lancer l'optimisation
</div>
)}
</button>
)}
</div>

{totalResponses === 0 ? (
<div className="text-center py-8">
<div className="text-gray-400 mb-4">
<Users className="w-16 h-16 mx-auto" />
</div>
<p className="text-gray-600 text-lg">Aucune inscription pour le moment</p>
<p className="text-gray-500">Les élèves peuvent s'inscrire via l'interface élève</p>
</div>
) : (
<div className="grid gap-4">
{inscriptions.length === 0 ? (
  <div className="text-center text-gray-500 space-y-2">
    <Users className="w-16 h-16 mx-auto" />
    <p className="text-gray-600 text-lg">Aucune inscription pour le moment</p>
    <p className="text-gray-500">Les élèves peuvent s'inscrire via l'interface élève</p>
  </div>
) : (
<div className="grid gap-4">
  <div className="mt-10">
    <h3 className="text-xl font-bold mb-4">Préférences des élèves</h3>
    {inscriptions.length === 0 ? (
      <p className="text-gray-500">Aucune inscription enregistrée.</p>
    ) : (
      <ul className="space-y-4">
        {inscriptions.map((entry, index) => (
          <li
            key={index}
            className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
          >
            <p className="font-semibold text-red-700">{entry.name}</p>
            <p className="text-sm text-gray-600 mb-1">
              Durée : {entry.duration} minutes
            </p>
            <p className="text-sm text-gray-600">Préférences :</p>
            <ul className="list-disc list-inside text-sm text-gray-800">
              {entry.slots.map((slot, i) => (
                <li key={i}>
                  Choix {i + 1} : {slot.display}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    )}
  </div>
</div>

{optimizationCompleted && (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200">
    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
      <CheckCircle className="w-6 h-6 text-green-600" />
      Résultats de l'optimisation
    </h3>

    <div className="grid gap-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Attributions réussies ({successfulAssignments})</h4>
        {finalSchedule
          .filter(assignment => assignment.slot)
          .map((assignment, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <span className="font-medium">{assignment.student}</span>
              <div className="text-right">
                <div className="text-sm font-medium">{assignment.slot.display}</div>
                <div className="text-xs text-gray-500">
                  {assignment.preferenceRank}er choix - {assignment.duration} min
                </div>
              </div>
            </div>
          ))}
      </div>

      {conflicts > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <h4 className="font-semibold text-red-800 mb-3">Conflits à résoudre ({conflicts})</h4>
          {finalSchedule
            .filter(assignment => assignment.status === 'conflit')
            .map((assignment, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-red-200 last:border-b-0">
                <span className="font-medium text-red-700">{assignment.student}</span>
                <span className="text-sm text-red-600">Contact nécessaire</span>
              </div>
            ))}
        </div>
      )}
    </div>
  </div>
)}
</div>
)}
