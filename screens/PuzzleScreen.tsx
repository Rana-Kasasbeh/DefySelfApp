import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const puzzleWord = "CAT";
const letters = ["C", "A", "T", "B", "R", "O"];

export default function PuzzleScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  const selectLetter = (letter: string) => {
    if (selected.length < puzzleWord.length) {
      setSelected([...selected, letter]);
    }
  };

  const isCorrect = selected.join('') === puzzleWord;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧩 حل اللغز</Text>
      <Text style={styles.word}>{selected.join('')}</Text>

      {isCorrect && <Text style={styles.correct}>✔ صحيح!</Text>}

      <View style={styles.letters}>
        {letters.map((l, i) => (
          <TouchableOpacity key={i} style={styles.letter} onPress={() => selectLetter(l)}>
            <Text style={styles.letterText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  word: { fontSize: 32, marginBottom: 10 },
  correct: { fontSize: 20, color: 'green', marginVertical: 10 },
  letters: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20 },
  letter: { borderWidth: 1, padding: 10, margin: 5, borderRadius: 6 },
  letterText: { fontSize: 20 },
});
