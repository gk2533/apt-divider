export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Top bar */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-semibold text-zinc-900 text-lg tracking-tight">Apt Divider</span>
          </a>
          <a
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
          >
            Back to app
          </a>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">
          About the Auction
        </h1>
        <p className="text-zinc-500 text-sm mb-10">
          A technical overview of the mechanism underlying Apt Divider.
        </p>

        {/* Section 1: The Problem */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">The Problem</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Consider <em>n</em> agents (roommates) who must divide <em>n</em> indivisible,
            heterogeneous goods (rooms) among themselves, subject to a fixed total cost
            (rent) that must be fully allocated. Each agent holds private cardinal
            valuations over the rooms. The goal is to find an assignment of agents to
            rooms and a vector of prices summing to the total rent such that the
            allocation satisfies desirable fairness properties.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            This is a classical problem in computational social choice and mechanism
            design, studied extensively since the work of Steinhaus (1948) on fair
            division. The specific formulation here follows the rent division variant
            analyzed by Su (1999), Abdulkadiroglu, Sonmez, and Unver (2004), and
            Gal, Mash, Procaccia, and Zick (2017), among others.
          </p>
        </section>

        {/* Section 2: Mechanism Design Goals */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Mechanism Design Goals</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The mechanism implemented here seeks an allocation satisfying three
            properties simultaneously:
          </p>
          <ol className="list-decimal list-outside ml-6 space-y-4 text-zinc-700 leading-relaxed">
            <li>
              <strong className="text-zinc-900">Budget Balance.</strong>{" "}
              The prices <span className="font-mono text-sm">p_1, p_2, ..., p_n</span> sum
              to exactly the total rent <span className="font-mono text-sm">R</span>. No
              surplus is created or destroyed.
            </li>
            <li>
              <strong className="text-zinc-900">Envy-Freeness (EF).</strong>{" "}
              For every agent <span className="font-mono text-sm">i</span> assigned to
              room <span className="font-mono text-sm">sigma(i)</span> at
              price <span className="font-mono text-sm">p_sigma(i)</span>, and for every
              alternative room <span className="font-mono text-sm">j</span>:
              <span className="block my-2 text-center font-mono text-sm text-zinc-800">
                v_i(sigma(i)) - p_sigma(i) &ge; v_i(j) - p_j
              </span>
              That is, no agent strictly prefers another agent&apos;s room-price bundle to
              their own. This is the strongest standard notion of fairness for divisible
              transfers with indivisible goods.
            </li>
            <li>
              <strong className="text-zinc-900">Maximin Utility (Egalitarian Optimality).</strong>{" "}
              Among all envy-free, budget-balanced price vectors, the mechanism selects
              the one that maximizes the minimum utility across all agents:
              <span className="block my-2 text-center font-mono text-sm text-zinc-800">
                max min_i [ v_i(sigma(i)) - p_sigma(i) ]
              </span>
              This is the egalitarian criterion from social welfare theory. It selects the
              most &ldquo;fair&rdquo; point within the envy-free polytope, preventing
              situations where one agent receives disproportionate surplus at the expense
              of others.
            </li>
          </ol>
        </section>

        {/* Section 3: Existence and Uniqueness */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Existence and Structure</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Su (1999) proved, using Sperner&apos;s lemma, that an envy-free allocation
            always exists when agents have quasilinear preferences over room-price
            bundles. The set of envy-free price vectors for a given assignment forms a
            convex polytope defined by the linear envy-freeness constraints. The
            maximin solution is unique (or lies on a face of the polytope) and can be
            computed efficiently via linear programming.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            When <em>n</em> = 3, the envy-free polytope is a convex subset
            of the 2-simplex (a triangle in price space, since prices sum to <em>R</em>).
            The maximin point is the Chebyshev center of this polytope with respect to
            the utility functions&mdash;the point maximizing the radius of the largest
            inscribed ball in utility space.
          </p>
        </section>

        {/* Section 4: Algorithm */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Algorithm</h2>
          <p className="text-zinc-700 leading-relaxed mb-3">
            The mechanism proceeds in two stages:
          </p>

          <div className="mb-6">
            <h3 className="text-base font-semibold text-zinc-900 mb-2">
              Stage 1: Welfare-Maximizing Assignment
            </h3>
            <p className="text-zinc-700 leading-relaxed mb-3">
              Compute the assignment <span className="font-mono text-sm">sigma*</span> that
              maximizes total social welfare:
            </p>
            <p className="text-center font-mono text-sm text-zinc-800 my-3">
              sigma* = argmax_sigma &Sigma;_i v_i(sigma(i))
            </p>
            <p className="text-zinc-700 leading-relaxed">
              For <em>n</em> = 3, this is solved by exhaustive enumeration of
              all <em>n</em>! = 6 permutations. For larger <em>n</em>, this reduces to the
              classical assignment problem, solvable in O(<em>n</em>&sup3;) via the
              Hungarian algorithm (Kuhn, 1955). The welfare-maximizing assignment is a
              necessary condition for the existence of an envy-free pricing: by the
              first welfare theorem, any competitive equilibrium (of which an envy-free
              allocation is an instance in this quasilinear setting) must be
              Pareto-efficient, and Pareto efficiency implies welfare maximization
              under quasilinear utilities.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-zinc-900 mb-2">
              Stage 2: Envy-Free Pricing via Linear Programming
            </h3>
            <p className="text-zinc-700 leading-relaxed mb-3">
              Given the optimal assignment <span className="font-mono text-sm">sigma*</span>,
              solve the following linear program for the price
              vector <span className="font-mono text-sm">(p_1, ..., p_n)</span> and
              slack variable <span className="font-mono text-sm">s</span>:
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 my-4 font-mono text-sm text-zinc-800 leading-loose">
              <p className="mb-1"><strong className="text-zinc-900">maximize</strong> s</p>
              <p className="mb-1"><strong className="text-zinc-900">subject to:</strong></p>
              <p className="ml-4 mb-1">&Sigma;_j p_j = R</p>
              <p className="ml-4 mb-1">p_j - p_sigma*(i) &ge; v_i(j) - v_i(sigma*(i))&emsp;&emsp;for all i, j &ne; sigma*(i)</p>
              <p className="ml-4 mb-1">p_sigma*(i) + s &le; v_i(sigma*(i))&emsp;&emsp;for all i</p>
              <p className="ml-4">p_j &ge; 0&emsp;&emsp;for all j</p>
            </div>
            <p className="text-zinc-700 leading-relaxed mb-3">
              The first constraint enforces budget balance. The second family of constraints
              enforces envy-freeness: rearranging, they state that
              agent <em>i</em>&apos;s utility from their assigned room is at least as high as
              from any alternative room at its posted price. The third family encodes the
              maximin objective: <span className="font-mono text-sm">s</span> is a lower
              bound on every agent&apos;s utility, and maximizing it pushes all utilities
              upward as equally as possible. The last constraint ensures no room has a
              negative price.
            </p>
            <p className="text-zinc-700 leading-relaxed">
              The LP is solved using the simplex method. Final prices are rounded to the
              nearest cent, with any rounding residual absorbed by the highest-priced room
              to preserve exact budget balance.
            </p>
          </div>
        </section>

        {/* Section 5: Incentive Properties */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Incentive Properties</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            This mechanism operates as a sealed-bid, direct-revelation mechanism. Each
            agent simultaneously reports a valuation vector over all rooms. Several
            incentive-theoretic observations are relevant:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3 text-zinc-700 leading-relaxed">
            <li>
              <strong className="text-zinc-900">No strategyproof mechanism exists</strong> for
              this setting that simultaneously satisfies envy-freeness and budget balance
              (Azrieli and Shmaya, 2014). That is, no mechanism can make truthful reporting
              a dominant strategy while also guaranteeing these fairness properties.
            </li>
            <li>
              <strong className="text-zinc-900">Approximate incentive compatibility.</strong>{" "}
              The maximin criterion limits the gains from misreporting. Since the mechanism
              equalizes utilities, an agent who inflates their bid for a room risks being
              assigned that room at a higher price. The sealed-bid format prevents
              iterative strategic adaptation.
            </li>
            <li>
              <strong className="text-zinc-900">Ex-post individual rationality.</strong>{" "}
              If each agent&apos;s valuation for at least one room exceeds
              their per-capita share of the rent (<span className="font-mono text-sm">R/n</span>),
              the maximin solution guarantees non-negative utility for every agent. No one
              is made worse off by participating in the mechanism relative to an equal split.
            </li>
          </ul>
        </section>

        {/* Section 6: Verification */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Verification</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The results page provides two verification tools:
          </p>
          <ul className="list-disc list-outside ml-6 space-y-3 text-zinc-700 leading-relaxed">
            <li>
              <strong className="text-zinc-900">Envy-free badge.</strong>{" "}
              The system verifies the envy-freeness condition computationally after
              solving. For every agent <em>i</em> and every alternative
              room <em>j</em>, it checks
              that <span className="font-mono text-sm">v_i(sigma(i)) - p_sigma(i) &ge; v_i(j) - p_j</span>.
              If the condition holds for all pairs, the allocation is certified as envy-free.
            </li>
            <li>
              <strong className="text-zinc-900">Swap calculator.</strong>{" "}
              Users can select any two agents and see a counterfactual analysis: what
              would each agent&apos;s utility be if they swapped rooms at the current
              prices? Because the allocation is envy-free, neither agent in any pair
              will prefer the other&apos;s bundle.
            </li>
          </ul>
        </section>

        {/* Section 7: References */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">References</h2>
          <ul className="space-y-3 text-zinc-700 text-sm leading-relaxed">
            <li>
              Abdulkadiroglu, A., Sonmez, T., &amp; Unver, M. U. (2004).
              Room assignment-rent division: A market approach.
              <em> Social Choice and Welfare</em>, 22(3), 515&ndash;538.
            </li>
            <li>
              Aragones, E. (1995).
              A derivation of the money Rawlsian solution.
              <em> Social Choice and Welfare</em>, 12(3), 267&ndash;276.
            </li>
            <li>
              Azrieli, Y., &amp; Shmaya, E. (2014).
              Rental harmony: Sperner&apos;s lemma in fair division.
              <em> The American Mathematical Monthly</em>, 121(3), 196&ndash;207.
            </li>
            <li>
              Gal, Y., Mash, M., Procaccia, A. D., &amp; Zick, Y. (2017).
              Which is the fairest (rent division) of them all?
              <em> Journal of the ACM</em>, 64(6), 1&ndash;22.
            </li>
            <li>
              Kuhn, H. W. (1955).
              The Hungarian method for the assignment problem.
              <em> Naval Research Logistics Quarterly</em>, 2(1&ndash;2), 83&ndash;97.
            </li>
            <li>
              Steinhaus, H. (1948).
              The problem of fair division.
              <em> Econometrica</em>, 16(1), 101&ndash;104.
            </li>
            <li>
              Su, F. E. (1999).
              Rental harmony: Sperner&apos;s lemma in fair division.
              <em> The American Mathematical Monthly</em>, 106(10), 930&ndash;942.
            </li>
          </ul>
        </section>

        <div className="border-t border-zinc-200 pt-6 mt-10">
          <p className="text-xs text-zinc-400">
            Apt Divider implements the maximin envy-free rent division mechanism for
            n = 3 agents. The solver uses exhaustive assignment enumeration and linear
            programming via the simplex method.
          </p>
        </div>
      </article>
    </main>
  );
}
