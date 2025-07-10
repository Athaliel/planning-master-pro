import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Music, Piano, UserCheck, UserX, TrendingUp, Play, FileText, Lock, Eye, EyeOff, Star, Target, Lightbulb } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function MusicScheduleOptimizer() {
const students = [
{ name: "Martin Léa", duration: 30 },
{ name: "Dubois Tom", duration: 45 },
{ name: "Bernard Emma", duration: 60 },
{ name: "Petit Lucas", duration: 30 },
{ name: "Robert Chloé", duration: 45 },
{ name: "Richard Noah", duration: 60 },
{ name: "Durand Inès", duration: 30 },
{ name: "Moreau Hugo", duration: 45 },
{ name: "Laurent Jade", duration: 60 },
{ name: "Simon Enzo", duration: 30 },
{ name: "Michel Lola", duration: 45 },
{ name: "Lefebvre Mila", duration: 60 },
{ name: "Leroy Nathan", duration: 30 },
{ name: "Roux Zoé", duration: 45 },
{ name: "David Evan", duration: 60 },
{ name: "Bertrand Lina", duration: 30 },
{ name: "Morel Théo", duration: 45 },
{ name: "Fournier Alice", duration: 60 },
{ name: "Girard Maël", duration: 30 },
{ name: "Bonnet Clara", duration: 45 },
{ name: "Dupont Louis", duration: 60 },
{ name: "Lambert Nina", duration: 30 },
{ name: "Fontaine Jules", duration: 45 },
{ name: "Rousseau Léna", duration: 60 },
{ name: "Vincent Oscar", duration: 30 },
{ name: "Muller Ambre", duration: 45 },
{ name: "Lefevre Gabriel", duration: 60 },
{ name: "Faure Manon", duration: 30 },
{ name: "Andre Raphaël", duration: 45 },
{ name: "Mercier Lily", duration: 60 },
{ name: "Blanc Axel", duration: 30 },
{ name: "Guerin Elise", duration: 45 }
];

const timeSlots = {
'Lundi': { start: 12, end: 20 },
'Mardi': { start: 12, end: 18 },
'Jeudi': { start: 12, end: 18 },
'Samedi': { start: 8, end: 13 }
};

const [currentView, setCurrentView] = useState('student');
const [selectedStudent, setSelectedStudent] = useState('');
const [studentPreferences, setStudentPreferences] = useState({});
useEffect(() => {
  const fetchPreferences = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'eleves'));
      const prefs = {};
      querySnapshot.forEach(doc => {
        const data = doc.data();
        prefs[data.student] = {
          duration: data.duration,
          slots: data.slots,
          timestamp: data.timestamp
        };
      });
      setStudentPreferences(prefs);
    } catch (error) {
      console.error("Erreur lors du chargement Firebase :", error);
    }
  };

  fetchPreferences();
}, []);

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
    const newPreferences = {
      duration,
      slots: selectedSlots,
      timestamp: new Date().toISOString()
    };

    setStudentPreferences({
      ...studentPreferences,
      [selectedStudent]: newPreferences
    });

    try {
      await addDoc(collection(db, 'eleves'), {
        student: selectedStudent,
        ...newPreferences
      });
      setHasSubmitted(true);
      alert('Préférences enregistrées avec succès !');
    } catch (error) {
      console.error("Erreur lors de l'enregistrement Firebase :", error);
      alert("Erreur lors de la sauvegarde.");
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

// Sauvegarde dans Firebase
optimizedSchedule.forEach(async (entry) => {
  try {
    await addDoc(collection(db, 'planning'), entry);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du planning :", error);
  }
});

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
{Object.entries(studentPreferences).map(([studentName, prefs]) => (
<div key={studentName} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
<div className="flex items-center justify-between mb-2">
<h4 className="font-semibold text-gray-800">{studentName}</h4>
<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
{prefs.duration} min
</span>
</div>
<div className="text-sm text-gray-600">
<strong>Préférences :</strong>
<ol className="list-decimal list-inside mt-1 space-y-1">
{prefs.slots.map((slot, index) => (
<li key={index}>{slot.display}</li>
))}
</ol>
</div>
</div>
))}
</div>
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

{currentView === 'planning' && optimizationCompleted && (
<div className="space-y-8">
{/* Planning par jour /}
<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200">
<h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
<Calendar className="w-6 h-6 text-green-600" />
Planning Final Optimisé - Vue par Jour
</h3>

<div className="grid gap-6">
{Object.entries(timeSlots).map(([day, hours]) => {
const dayAssignments = organizedSchedule[day] || [];
const timeSlotHours = [];

// Créer les créneaux horaires par pas de 30 minutes
for (let hour = hours.start; hour < hours.end; hour++) {
for (let minute = 0; minute < 60; minute += 30) {
if (hour + minute/60 < hours.end) {
const timeStr = ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')};
const endHour = minute === 30 ? hour + 1 : hour;
const endMinute = minute === 30 ? 0 : 30;
const endTimeStr = ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')};

// Vérifier s'il y a un cours à ce créneau
const assignment = dayAssignments.find(a => {
const startTime = a.slot.startTime;
const endTime = a.slot.endTime;
return startTime <= timeStr && endTime > timeStr;
});

timeSlotHours.push({
time: timeStr,
endTime: endTimeStr,
assignment
});
}
}
}

return (
<div key={day} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
<h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
<Clock className="w-5 h-5 text-blue-600" />
{day} ({hours.start}h - {hours.end}h)
</h4>

<div className="grid gap-2">
{timeSlotHours.map((slot, index) => (
<div key={index} className={p-3 rounded-lg border transition-all ${                                 slot.assignment                                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300'                                    : 'bg-gray-50 border-gray-200'                               }}>
<div className="flex items-center justify-between">
<div className="font-mono text-sm font-semibold text-gray-700">
{slot.time} - {slot.endTime}
</div>
{slot.assignment ? (
<div className="flex items-center gap-4">
<div>
<div className="font-semibold text-blue-800">
{slot.assignment.student}
</div>
<div className="text-xs text-blue-600">
{slot.assignment.duration}min - {slot.assignment.preferenceRank}er choix
</div>
</div>
<div className="w-3 h-3 bg-green-500 rounded-full"></div>
</div>
) : (
<div className="text-gray-400 text-sm">Libre</div>
)}
</div>
</div>
))}
</div>

<div className="mt-4 p-3 bg-blue-50 rounded-lg">
<div className="text-sm text-blue-800">
<strong>Résumé :</strong> {dayAssignments.length} cours programmés
{dayAssignments.length > 0 && (
<span> • Durée totale : {dayAssignments.reduce((total, a) => total + a.duration, 0)} minutes</span>
)}
</div>
</div>
</div>
);
})}
</div>
</div>

{/ Analyse des conflits /}
{conflicts > 0 && (
<div className="bg-gradient-to-r from-red-50 to-orange-50 p-8 rounded-2xl border border-red-200">
<h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
<AlertCircle className="w-6 h-6 text-red-600" />
Analyse des Conflits et Solutions Proposées
</h3>

<div className="space-y-6">
{finalSchedule
.filter(assignment => assignment.status === 'conflit')
.map((conflictAssignment, index) => {
// Analyser pourquoi il y a conflit
const allOtherAssignments = finalSchedule.filter(a => a.slot && a.student !== conflictAssignment.student);
const conflictAnalysis = [];

conflictAssignment.preferences.forEach((preferredSlot, prefIndex) => {
const conflictingAssignment = allOtherAssignments.find(a => {
if (a.slot.day !== preferredSlot.day) return false;
const start1 = parseInt(a.slot.startTime.replace(':', ''));
const end1 = parseInt(a.slot.endTime.replace(':', ''));
const start2 = parseInt(preferredSlot.startTime.replace(':', ''));
const end2 = parseInt(preferredSlot.endTime.replace(':', ''));
return !(end1 <= start2 || end2 <= start1);
});

conflictAnalysis.push({
preference: prefIndex + 1,
slot: preferredSlot,
conflictWith: conflictingAssignment,
isAvailable: !conflictingAssignment
});
});

// Proposer des solutions
const availableSlots = generateTimeSlots(conflictAssignment.duration)
.filter(slot => {
return !allOtherAssignments.some(a => {
if (a.slot.day !== slot.day) return false;
const start1 = parseInt(a.slot.startTime.replace(':', ''));
const end1 = parseInt(a.slot.endTime.replace(':', ''));
const start2 = parseInt(slot.startTime.replace(':', ''));
const end2 = parseInt(slot.endTime.replace(':', ''));
return !(end1 <= start2 || end2 <= start1);
});
})
.slice(0, 5); // Limiter à 5 suggestions

return (
<div key={index} className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
<h4 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
<Target className="w-5 h-5" />
Conflit : {conflictAssignment.student} ({conflictAssignment.duration} minutes)
</h4>

{/ Analyse des préférences /}
<div className="mb-6">
<h5 className="font-semibold text-gray-800 mb-3">Analyse des préférences :</h5>
<div className="space-y-2">
{conflictAnalysis.map((analysis, idx) => (
<div key={idx} className={p-3 rounded-lg border ${                                       analysis.isAvailable                                          ? 'bg-green-50 border-green-200'                                          : 'bg-red-50 border-red-200'                                     }}>
<div className="flex items-center justify-between">
<div>
<span className="font-medium">
{analysis.preference}er choix : {analysis.slot.display}
</span>
</div>
<div>
{analysis.isAvailable ? (
<span className="text-green-600 font-medium">✓ Disponible</span>
) : (
<span className="text-red-600 font-medium">
✗ Occupé par {analysis.conflictWith.student}
</span>
)}
</div>
</div>
</div>
))}
</div>
</div>

{/ Solutions proposées /}
<div className="mb-4">
<h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
<Lightbulb className="w-5 h-5 text-yellow-500" />
Solutions proposées :
</h5>

{availableSlots.length > 0 ? (
<div className="space-y-2">
<div className="grid gap-2">
{availableSlots.map((solution, sIdx) => (
<div key={sIdx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
<div className="flex items-center justify-between">
<span className="font-medium text-yellow-800">
Option {sIdx + 1} : {solution.display}
</span>
<button className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
Assigner
</button>
</div>
</div>
))}
</div>
</div>
) : (
<div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
<p className="text-gray-600">
Aucun créneau disponible pour cette durée.
<strong> Actions recommandées :</strong>
</p>
<ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
<li>Contact direct avec l'élève pour négocier un autre créneau</li>
<li>Proposer de modifier la durée du cours (si possible)</li>
<li>Réorganiser d'autres créneaux pour libérer de la place</li>
<li>Proposer un cours en dehors des créneaux préférés</li>
</ul>
</div>
)}
</div>

{/ Actions rapides /}
<div className="flex gap-2 pt-4 border-t border-gray-200">
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
Contacter l'élève
</button>
<button className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
Réoptimiser
</button>
<button className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
Reporter
</button>
</div>
</div>
);
})}
</div>

{/ Recommandations générales /}
<div className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-2xl">
<h5 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
<Star className="w-5 h-5" />
Recommandations pour réduire les conflits futurs :
</h5>
<ul className="list-disc list-inside space-y-2 text-orange-700">
<li>Élargir les plages horaires disponibles si possible</li>
<li>Encourager les élèves à diversifier leurs préférences</li>
<li>Considérer des cours de durées variables selon la demande</li>
<li>Implémenter un système de priorité pour les élèves anciens</li>
<li>Proposer des créneaux alternatifs attractifs</li>
</ul>
</div>
</div>
)}

{/ Actions sur le planning */}
<div className="flex gap-4 justify-center">
<button
onClick={() => window.print()}
className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-xl"
>
<FileText className="w-5 h-5 inline mr-3" />
Imprimer le planning
</button>
<button
  onClick={() => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Élève,Jour,Heure début,Heure fin,Durée,Préférence\n" +
      finalSchedule
        .filter((a) => a.slot)
        .map(
          (a) =>
            `${a.student},${a.slot.day},${a.slot.startTime},${a.slot.endTime},${a.duration},${a.preferenceRank}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "planning_cours_musique.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }}
>
  Exporter CSV
</button>
</div>
</div>
)}

</div>
</div>
</div>
</div>
);
}
