import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('runtime', Path(__file__).with_name('native-agent-runtime.py'))
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


class RuntimeSafetyTests(unittest.TestCase):
    def issue(self, tags):
        return {'state': 'open', 'labels': [{'name': tag} for tag in tags]}

    def test_native_requires_owner_approval(self):
        issue = self.issue(['risk:low', 'agent:build-approved'])
        owner = [{'user': {'login': 'owner'}, 'body': 'BUILD_APPROVED'}]
        self.assertTrue(runtime.eligible_issue(issue, owner, 'owner'))
        self.assertFalse(runtime.eligible_issue(issue, owner, 'attacker'))
        self.assertFalse(runtime.eligible_issue(issue, [], 'owner'))

    def test_cursor_labels_do_not_authorize_native_runtime(self):
        self.assertFalse(runtime.eligible_issue(self.issue(['risk:low', 'cursor:pilot-approved']),
                         [{'user': {'login': 'owner'}, 'body': 'BUILD_APPROVED'}], 'owner'))

    def test_mixed_high_risk_denied(self):
        for tag in ['risk:high', 'risk:critical', 'status:completed', 'status:blocked']:
            self.assertFalse(runtime.eligible_issue(self.issue(['risk:low', 'agent:build-approved', tag]),
                             [{'user': {'login': 'owner'}, 'body': 'BUILD_APPROVED'}], 'owner'))

    def test_medium_needs_separate_label(self):
        comments = [{'user': {'login': 'owner'}, 'body': 'BUILD_APPROVED'}]
        self.assertFalse(runtime.eligible_issue(self.issue(['risk:medium', 'agent:build-approved']), comments, 'owner'))
        self.assertTrue(runtime.eligible_issue(self.issue(['risk:medium', 'agent:build-approved-medium']), comments, 'owner'))

    def test_patch_cannot_edit_workflows_policy_auth_or_secrets(self):
        runtime.validate_patch_paths(['src/features/crm/example.ts', 'docs/guide.md'])
        for path in ['.github/workflows/ci.yml', 'AGENTS.md', 'prisma/schema.prisma',
                     'src/.env', 'src/../.github/run.yml', '/src/absolute.ts',
                     'src/lib/auth.ts', 'src/features/payments/service.ts', 'src/private.key',
                     'src/lib/admin-permissions.ts', 'src/features/pricing/calculate.ts']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                runtime.validate_patch_paths([path])
        with self.assertRaises(ValueError):
            runtime.validate_patch_paths([])


if __name__ == '__main__':
    unittest.main()
