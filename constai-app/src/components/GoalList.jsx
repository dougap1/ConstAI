import GoalCard from './GoalCard'

/**
 * GoalList — grid of goals + optional slot for “new goal” UI above.
 * AI hook: sort by relevance, surface “suggested goal” from chat history.
 */
export default function GoalList({
  goals,
  selectedGoalId,
  onSelectGoal,
  onRequestRemoveGoal,
  headerSlot,
  footerSlot,
}) {
  return (
    <section className="space-y-4">
      {headerSlot}
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((g) => {
          const done = g.tasks.filter((t) => t.done).length
          return (
            <GoalCard
              key={g.id}
              title={g.title}
              taskTotal={g.tasks.length}
              taskDone={done}
              deadline={g.deadline}
              selected={g.id === selectedGoalId}
              onClick={() => onSelectGoal(g.id)}
              onRequestRemove={
                onRequestRemoveGoal
                  ? () => onRequestRemoveGoal(g.id, g.title)
                  : undefined
              }
            />
          )
        })}
      </div>
      {footerSlot}
    </section>
  )
}
