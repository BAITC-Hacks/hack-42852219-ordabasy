"""Golden results and edge cases for the authoritative server model."""

from copy import deepcopy
from itertools import permutations
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from app.domain import SimulationEngine, ValidationError


def decision(initiative_id, district_id=None):
    return {"initiativeId": initiative_id, "districtId": district_id}


REFERENCE = [
    decision("M7", "nura"), decision("M8", "nura"),
    decision("M10", "nura"), decision("M12"), decision("M5", "saryarka"),
]
CHEAPEST = [
    decision("M9", "nura"), decision("M11", "nura"),
    decision("M10", "nura"), decision("M12"), decision("M4", "saryarka"),
]


class TestEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SimulationEngine()

    def district(self, snapshot, district_id):
        return next(item for item in snapshot["districts"] if item["id"] == district_id)

    def codes(self, decisions, final=False):
        return {item["code"] for item in self.engine.validate(decisions, final=final)["errors"]}

    def altered_dataset(self, mutations):
        """Boundary fixtures exercise clipping/thresholds via the public API."""
        temp = TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        data_path = Path(temp.name)
        bootstrap = self.engine.bootstrap()
        for district_id, indicator, value in mutations:
            self.district(bootstrap, district_id)["indicators"][indicator] = value
        (data_path / "districts.json").write_text(json.dumps(bootstrap["districts"]), encoding="utf-8")
        (data_path / "initiatives.json").write_text(json.dumps(bootstrap["initiatives"]), encoding="utf-8")
        return SimulationEngine(data_path)

    def test_canonical_data_and_baseline(self):
        data = self.engine.bootstrap()
        self.assertEqual(len(data["districts"]), 5)
        self.assertEqual(len(data["initiatives"]), 14)
        self.assertEqual(len(data["indicators"]), 10)
        self.assertAlmostEqual(sum(item["populationShare"] for item in data["districts"]), 1)
        self.assertAlmostEqual(sum(item["weight"] for item in data["indicators"]), 1)
        baseline = data["baseline"]
        self.assertAlmostEqual(baseline["averageScore"], 56.8624)
        self.assertAlmostEqual(baseline["minimumScore"], 49.18)
        self.assertEqual(baseline["weakestDistrictId"], "nura")
        self.assertEqual(baseline["criticalCount"], 2)
        self.assertEqual({(item["districtId"], item["indicator"]) for item in baseline["criticalIndicators"]}, {("nura", "S1"), ("nura", "S2")})
        self.assertAlmostEqual(baseline["score"], 52.55768)
        self.assertEqual(f"{baseline['score']:.2f}", "52.56")

    def test_reference_result_full_precision_and_lags(self):
        output = self.engine.simulate(REFERENCE, scenario_version="test-v3")
        self.assertEqual(output["scenarioVersion"], "test-v3")
        self.assertEqual(output["budget"], {"limit": 100, "spent": 95, "remaining": 5})
        self.assertAlmostEqual(output["result"]["score"], 56.54307)
        self.assertEqual(f"{output['result']['score']:.2f}", "56.54")
        self.assertEqual(f"{output['scoreChange']:+.2f}", "+3.99")
        self.assertEqual(output["result"]["criticalCount"], 0)
        nura = self.district(output["result"], "nura")["indicators"]
        self.assertEqual(nura["S1"], 48)
        self.assertEqual(nura["S2"], 43.75)
        self.assertEqual(nura["B1"], 67.5)
        self.assertEqual(output["synergies"][0]["districtId"], "nura")
        for phase, key in [("before", "baseline"), ("after", "result")]:
            parts = output["scoreBreakdown"][phase]
            self.assertAlmostEqual(parts["weightedAverage"] + parts["weightedMinimum"] - parts["penalty"], output[key]["score"])

    def test_cheapest_reference_is_valid_and_differs(self):
        output = self.engine.simulate(CHEAPEST)
        self.assertEqual(output["budget"]["spent"], 61)
        self.assertNotAlmostEqual(output["result"]["score"], self.engine.simulate(REFERENCE)["result"]["score"])

    def test_draft_versus_final_validation(self):
        self.assertTrue(self.engine.validate([])["valid"])
        self.assertFalse(self.engine.validate([])["complete"])
        self.assertIn("incomplete_scenario", self.codes(REFERENCE[:4], final=True))
        self.assertTrue(self.engine.validate(REFERENCE, final=True)["complete"])
        self.assertIn("too_many_decisions", self.codes(CHEAPEST + [decision("M14")]))
        with self.assertRaises(ValidationError) as context:
            self.engine.simulate(REFERENCE[:4])
        self.assertEqual(context.exception.errors, context.exception.validation["errors"])

    def test_budget_exactly_100_and_above(self):
        exact = [decision("M3", "nura"), decision("M7", "nura"), decision("M6"), decision("M10", "nura"), decision("M12")]
        self.assertEqual(self.engine.simulate(exact)["budget"]["remaining"], 0)
        excessive = [*exact[:3], decision("M14"), exact[4]]
        validation = self.engine.validate(excessive, final=True)
        self.assertIn("budget_exceeded", self.codes(excessive))
        self.assertEqual(validation["budget"]["spent"], 104)
        self.assertEqual(validation["budget"]["remaining"], -4)
        with self.assertRaises(ValidationError):
            self.engine.simulate(excessive)

    def test_uniqueness_and_category_limit(self):
        self.assertIn("duplicate_initiative", self.codes([decision("M9", "nura"), decision("M9", "esil")]))
        three_social = [decision("M7", "nura"), decision("M8", "nura"), decision("M9", "esil"), decision("M10", "nura"), decision("M12")]
        self.assertIn("category_limit", self.codes(three_social))
        # A valid plan may contain no transport measures and two social measures.
        self.assertTrue(self.engine.validate(REFERENCE, final=True)["valid"])

    def test_global_conflict_ignores_district(self):
        for district in ("nura", "esil"):
            self.assertIn("incompatible_initiatives", self.codes([decision("M1", "nura"), decision("M3", district)]))

    def test_district_conflicts_only_in_same_district(self):
        for first, second in (("M4", "M7"), ("M5", "M13")):
            with self.subTest(first=first):
                self.assertIn("incompatible_initiatives", self.codes([decision(first, "nura"), decision(second, "nura")]))
                self.assertTrue(self.engine.validate([decision(first, "nura"), decision(second, "esil")])["valid"])

    def test_district_requirements_and_unknown_ids(self):
        self.assertIn("district_required", self.codes([decision("M1")]))
        self.assertIn("unknown_district", self.codes([decision("M1", "missing")]))
        self.assertIn("city_district_forbidden", self.codes([decision("M2", "nura")]))
        self.assertIn("unknown_initiative", self.codes([decision("M99", "nura")]))
        self.assertTrue(self.engine.validate([{"initiativeId": "M2"}])["valid"])
        for malformed in (None, {}, "M1", [None], [{"initiativeId": []}], [decision("M1", [])]):
            with self.subTest(malformed=malformed):
                self.assertFalse(self.engine.validate(malformed)["valid"])

    def test_server_catalog_ignores_client_prices_and_effects(self):
        forged = deepcopy(REFERENCE)
        forged[0].update(cost=-1000, effects={"S1": 1000}, score=100)
        self.assertEqual(self.engine.simulate(forged), self.engine.simulate(REFERENCE))
        with patch.dict("os.environ", {"SIMULATION_BUDGET": "900", "BUDGET": "900"}):
            self.assertEqual(SimulationEngine().bootstrap()["rules"]["budget"], 100)

    def test_transport_synergy_is_fixed_and_district_scoped(self):
        selected = [decision("M1", "nura"), decision("M2"), decision("M4", "saryarka"), decision("M9", "esil"), decision("M12")]
        output = self.engine.simulate(selected)
        self.assertEqual(self.district(output["result"], "nura")["indicators"]["T1"], 64.5)
        self.assertEqual(self.district(output["result"], "esil")["indicators"]["T1"], 48)
        self.assertEqual(output["synergies"], [{"id": "M1_M2", "initiatives": ["M1", "M2"], "targetInitiative": "M1", "effects": {"T1": 2}, "districtId": "nura"}])

    def test_ecology_synergy_and_city_scope(self):
        selected = [decision("M5", "saryarka"), decision("M6"), decision("M9", "nura"), decision("M10", "nura"), decision("M12")]
        output = self.engine.simulate(selected)
        for district in output["result"]["districts"]:
            original = self.district(output["baseline"], district["id"])["indicators"]
            self.assertEqual(district["indicators"]["E1"], original["E1"] + 2.5)
            self.assertEqual(district["indicators"]["C2"], original["C2"] + 4.375)
        self.assertEqual(self.district(output["result"], "saryarka")["indicators"]["E2"], 52.25)
        self.assertEqual(self.district(output["result"], "esil")["indicators"]["E2"], 73.5)

    def test_negative_effect_can_create_a_new_critical_indicator(self):
        selected = deepcopy(CHEAPEST)
        selected[1] = decision("M11", "almaty")
        output = self.engine.simulate(selected)
        self.assertIn({"districtId": "almaty", "indicator": "T1", "value": 38.25}, output["result"]["criticalIndicators"])

    def test_strict_threshold_without_rounding(self):
        engine = self.altered_dataset([("nura", "S1", 40), ("nura", "S2", 39.99999)])
        baseline = engine.bootstrap()["baseline"]
        self.assertEqual(baseline["criticalCount"], 1)
        self.assertEqual(baseline["criticalIndicators"][0]["indicator"], "S2")
        self.assertEqual(f"{baseline['criticalIndicators'][0]['value']:.2f}", "40.00")

    def test_clips_once_after_positive_and_negative_effects(self):
        engine = self.altered_dataset([("esil", "T1", 98), ("esil", "B2", 98)])
        selected = [decision("M2"), decision("M4", "saryarka"), decision("M9", "nura"), decision("M11", "esil"), decision("M12")]
        esil = self.district(engine.simulate(selected)["result"], "esil")["indicators"]
        self.assertEqual(esil["T1"], 99.25)
        self.assertEqual(esil["B2"], 100)
        engine = self.altered_dataset([("nura", "T1", 0)])
        self.assertEqual(self.district(engine.simulate(CHEAPEST)["result"], "nura")["indicators"]["T1"], 0)

    def test_all_permutations_return_identical_results(self):
        expected = self.engine.simulate(REFERENCE)
        for order in permutations(REFERENCE):
            self.assertEqual(self.engine.simulate(list(order)), expected)

    def test_no_mutation_and_recalculation_after_remove_readd(self):
        original = deepcopy(REFERENCE)
        bootstrap = self.engine.bootstrap()
        expected = self.engine.simulate(REFERENCE)
        without_one = REFERENCE[1:]
        self.assertTrue(self.engine.validate(without_one)["valid"])
        self.assertEqual(self.engine.simulate([*without_one, REFERENCE[0]]), expected)
        self.assertEqual(REFERENCE, original)
        self.assertEqual(self.engine.bootstrap(), bootstrap)
        returned = self.engine.simulate(REFERENCE)
        returned["result"]["districts"][0]["indicators"]["T1"] = 999
        returned["effects"][0]["fullEffects"]["E2"] = 999
        bootstrap["districts"][0]["indicators"]["T1"] = 999
        bootstrap["rules"]["synergies"][0]["effects"]["T1"] = 999
        self.assertEqual(self.engine.simulate(REFERENCE), expected)

    def test_invalid_replacement_cannot_mutate_original(self):
        original = deepcopy(REFERENCE)
        candidate = deepcopy(original)
        candidate[0] = decision("M8", "nura")
        with self.assertRaises(ValidationError):
            self.engine.simulate(candidate)
        self.assertEqual(original, REFERENCE)
        self.assertAlmostEqual(self.engine.simulate(original)["result"]["score"], 56.54307)

    def test_analysis_context_is_same_trusted_calculation(self):
        self.assertEqual(self.engine.analysis_context(REFERENCE, "version-7"), self.engine.simulate(REFERENCE, "version-7"))


if __name__ == "__main__":
    unittest.main()
