'use client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQueryState } from '@/hooks/query-state'
import { TeamInfo } from '@/lib/standings/get-standings'
import { AdvantageInfo } from '@/lib/standings/tiebreakers'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

export const TeamRow: React.FunctionComponent<{
  teamInfo: TeamInfo
}> = ({ teamInfo: { team: school, advantageInfo } }) => {
  const [, setTeamId] = useQueryState<number | undefined>({ key: 'drawer' })

  return (
    <TableRow
      className='hover:cursor-pointer'
      key={school.id}
      onClick={() => setTeamId(school.id)}
    >
      {/* <TableCell>
        
      </TableCell> */}
      <TableCell className='flex items-center gap-1'>
        {advantageInfo ? (
          <AdvantageInfoPopover info={advantageInfo} />
        ) : (
          <div className='mr-4' />
        )}
        {school.title}
      </TableCell>
      <TableCell>
        {school.overallRecord.wins}-{school.overallRecord.losses} (
        {school.record.wins}-{school.record.losses})
      </TableCell>
    </TableRow>
  )
}

export const AdvantageInfoPopover: React.FunctionComponent<{
  info: AdvantageInfo
}> = ({ info }) => {
  const [, setTeamId] = useQueryState<number | undefined>({ key: 'drawer' })

  const commonTeams = new Set<string>(
    info.results
      .flatMap(({ result }) => result.commonTeams?.map((team) => team.title))
      .filter(Boolean) as string[]
  )
  const results = info.results
    .slice()
    .sort((a, b) => b.result.result - a.result.result)
  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <QuestionMarkCircleIcon className='h-4 w-4' />
      </PopoverTrigger>
      <PopoverContent>
        <h1 className='text-lg font-semibold text-center'>
          Tiebreaker Scenario
        </h1>
        {info.tiebreaker.ruleNumber}. {info.tiebreaker.title}
        <p className='text-xs'>
          {info.type === 'two-team'
            ? info.tiebreaker.twoTeamDescription
            : info.tiebreaker.multiTeamDescription}
        </p>
        {commonTeams.size > 0 ? (
          <p>
            Common Teams:{' '}
            <span className='text-sm'>
              {Array.from(commonTeams.values()).join(', ')}
            </span>
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableHead>Team</TableHead>
            <TableHead>Result</TableHead>
          </TableHeader>
          <TableBody>
            {results.map(({ team, result: { result } }) => (
              <TableRow
                key={team.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setTeamId(team.id)
                }}
              >
                <TableCell>{team.title}</TableCell>
                <TableCell>
                  {result === -1 ? 'N/A' : `${Math.round(result * 1000) / 10}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PopoverContent>
    </Popover>
  )
}
