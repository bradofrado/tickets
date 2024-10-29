'use server'

import {
  allGames,
  BigXiiGame,
  BigXiiSchool,
  BigXiiSchoolWithGames,
} from '@/lib/games-info'
import { getStandings as getStandingsRaw } from '@/lib/standings/get-standings'
import { calculateRecord } from '@/lib/standings/utils'
import {
  generateReceiveCode as generateReceiveCodeServer,
  downloadTicket as downloadTicketServer,
} from '@/server/receive-code'

export const generateReceiveCode: typeof generateReceiveCodeServer = async (
  ...props
) => {
  return generateReceiveCodeServer(...props)
}

export const downloadTicket: typeof downloadTicketServer = async (...props) => {
  return downloadTicketServer(...props)
}

// export const getAllGames = async (): Promise<BigXiiGame[]> => {
//   return allGames
// }

export const getStandings = async (): Promise<BigXiiSchoolWithGames[]> => {
  const schools = await getBigXiiSchools()
  return getStandingsRaw(schools)
}

const getBigXiiSchools = async (): Promise<BigXiiSchoolWithGames[]> => {
  const games = allGames
  const schools = new Map<number, BigXiiSchool>()
  games.forEach((game) => {
    let school = schools.get(game.school.id)
    let opponent = schools.get(game.opponent.id)
    if (!school) {
      school = game.school
      schools.set(game.school.id, game.school)
    }

    if (!opponent) {
      opponent = game.opponent
      schools.set(game.opponent.id, opponent)
    }
  })

  const allSchools: BigXiiSchoolWithGames[] = Array.from(schools.values()).map(
    (school) => {
      return {
        ...school,
        games: new Map<number, BigXiiGame>(),
        allGames: [],
        record: { wins: 0, losses: 0 },
        overallRecord: { wins: 0, losses: 0 },
      }
    }
  )

  const conferenceGames = games
    .filter((game) => game.is_conference)
    .map((g) => g.id)
  games.forEach((game) => {
    const school = allSchools.find((school) => school.id === game.school.id)
    const opponent = allSchools.find((school) => school.id === game.opponent.id)
    if (!school || !opponent) throw new Error("Schools weren't found")

    const gameWithSchool: BigXiiGame = {
      ...game,
      school,
      opponent,
      result: game.result?.status ?? '',
    }
    school.allGames.push(gameWithSchool)
    opponent.allGames.push(gameWithSchool)

    if (!game.is_conference) return gameWithSchool

    school.games.set(game.opponent.id, gameWithSchool)
    opponent.games.set(game.school.id, gameWithSchool)

    return gameWithSchool
  })

  allSchools.forEach((school) => {
    school.record = calculateRecord(school, Array.from(school.games.values()))
    school.overallRecord = calculateRecord(school, school.allGames)
  })

  return allSchools.filter((school) =>
    school.allGames.find((g) => conferenceGames.includes(g.id))
  )
}
