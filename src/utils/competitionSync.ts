import { Competition, CompetitionStatus, RecitationRecord } from '../types';
import { getTodayISO } from './date';

/**
 * Checks if a Surah progression moves toward the target Surah.
 * Supports both ascending Mushaf order (e.g., 62 Al-Jumu'ah -> 39 Az-Zumar? Wait!
 * Notice in the user's example:
 * Start: سورة الجمعة (62), Target: سورة الزمر (39) — i.e., reverse Mushaf order (Juz 28 -> Juz 23)!
 * AND some circles memorize forward (1 -> 2 -> 3, or 78 -> 114).
 * So we cleanly support BOTH directions based on startSurahNumber vs targetSurahNumber!
 */
export function computeCompetitionDirection(startSurah: number, targetSurah: number): 1 | -1 {
  return targetSurah >= startSurah ? 1 : -1;
}

export function hasSurahReachedTarget(
  surahNumber: number,
  startSurah: number,
  targetSurah: number
): boolean {
  const dir = computeCompetitionDirection(startSurah, targetSurah);
  if (dir === 1) {
    return surahNumber >= targetSurah;
  }
  return surahNumber <= targetSurah;
}

export function computeCompetitionProgressPercent(
  currentSurah: number,
  startSurah: number,
  targetSurah: number
): number {
  const dir = computeCompetitionDirection(startSurah, targetSurah);
  const totalSpan = Math.abs(targetSurah - startSurah);
  if (totalSpan === 0) {
    return currentSurah === targetSurah ? 100 : 0;
  }
  const advanced =
    dir === 1 ? currentSurah - startSurah : startSurah - currentSurah;
  if (advanced <= 0) return 0;
  if (advanced >= totalSpan) return 100;
  return Math.round((advanced / totalSpan) * 100);
}

/**
 * Syncs all active competitions against the student's actual Hifz records.
 * Returns updated competitions and a list of newly-achieved winner alerts.
 */
export function syncCompetitionsWithHifz(
  competitions: Competition[],
  recitations: RecitationRecord[]
): {
  updated: Competition[];
  newAchievers: { competitionName: string; studentId: string; reward: string }[];
} {
  const today = getTodayISO();
  const newAchievers: { competitionName: string; studentId: string; reward: string }[] = [];

  const updated = competitions.map((comp) => {
    if (comp.archived) return comp;

    const dir = computeCompetitionDirection(comp.startSurahNumber, comp.targetSurahNumber);
    const isPastEnd = today > comp.endDate;

    const nextParticipants = comp.participants.map((p) => {
      // Find all hifz records for this student on or after competition startDate (up to endDate)
      const studentHifz = recitations.filter(
        (r) =>
          r.type === 'hifz' &&
          r.studentId === p.studentId &&
          r.date >= comp.startDate &&
          r.date <= comp.endDate
      );

      // If already achieved, preserve achievement
      if (p.status === 'achieved') {
        return p;
      }

      if (studentHifz.length === 0) {
        return {
          ...p,
          currentSurahNumber: comp.startSurahNumber,
          status: (isPastEnd ? 'expired' : 'not_started') as CompetitionStatus,
        };
      }

      // Sort by date ascending to detect exact date target was reached
      const sorted = [...studentHifz].sort((a, b) => a.date.localeCompare(b.date));

      let bestSurah = comp.startSurahNumber;
      let achievedAt: string | undefined;

      for (const rec of sorted) {
        const s = rec.surahNumber;
        const isFurther = dir === 1 ? s > bestSurah : s < bestSurah;
        // Also ensure the surah is along the competition path or beyond target
        const inRangeFromStart = dir === 1 ? s >= comp.startSurahNumber : s <= comp.startSurahNumber;
        if (inRangeFromStart && isFurther) {
          bestSurah = s;
        } else if (dir === 1 && s >= comp.targetSurahNumber) {
          bestSurah = s;
        } else if (dir === -1 && s <= comp.targetSurahNumber) {
          bestSurah = s;
        }

        if (!achievedAt && hasSurahReachedTarget(s, comp.startSurahNumber, comp.targetSurahNumber)) {
          achievedAt = rec.date;
        }
      }

      if (achievedAt) {
        newAchievers.push({
          competitionName: comp.name,
          studentId: p.studentId,
          reward: comp.reward,
        });
        return {
          ...p,
          currentSurahNumber: comp.targetSurahNumber,
          status: 'achieved' as CompetitionStatus,
          achievedAt,
          prizeName: p.prizeName || comp.reward,
        };
      }

      return {
        ...p,
        currentSurahNumber: bestSurah,
        status: (isPastEnd ? 'expired' : 'in_progress') as CompetitionStatus,
      };
    });

    return {
      ...comp,
      participants: nextParticipants,
    };
  });

  return { updated, newAchievers };
}
