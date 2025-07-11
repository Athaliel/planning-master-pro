import React, { useState, useEffect } from 'react';
import { Lock, Target } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

function App() {
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [finalSchedule, setFinalSchedule] = useState([]);

  const TEACHER_PASSWORD = 'prof123';

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

  useEffect(() => {
    const fetchSchedule = async () => {
      if (isTeacherLoggedIn) {
        try {
          const querySnapshot = await getDocs(collection(db, 'planning'));
          const data = querySnapshot.docs.map(doc => doc.data());
          setFinalSchedule(data);
        } catch (error) {
          console.error("Erreur lors de la récupération du planning :", error);
        }
      }
    };

    fetchSchedule();
  }, [isTeacherLoggedIn]);

  let satisfactionScore = 0;
  let conflicts = 0;

  if (finalSchedule && Array.isArray(finalSchedule)) {
    conflicts = finalSchedule.filter(a => a.status === 'conflit').length;

    satisfactionScore = finalSchedule.reduce((score, assignment) => {
      if (assignment.preferenceRank) {
        return score + (5 - assignment.preferenceRank);
      }
      return score;
    }, 0);
  }

  return (
    <div className="App">
      {!isTeacherLoggedIn ? (
        <div>
          <input
            type="password"
            value={teacherPassword}
            onChange={(e) => setTeacherPassword(e.target.value)}
            placeholder="Mot de passe"
          />
          <button onClick={handleTeacherLogin}>
            <Lock className="w-5 h-5 inline mr-3" />
            Se connecter
          </button>
          {loginError && <p>{loginError}</p>}
        </div>
      ) : (
        <div>
          <h2>Planning des élèves</h2>
          <p>Nombre de conflits : {conflicts}</p>
          <p>Score de satisfaction : {satisfactionScore}</p>
          {finalSchedule.map((assignment, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
              <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {assignment.student} ({assignment.duration} minutes)
              </h4>
              <pre>{JSON.stringify(assignment, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
