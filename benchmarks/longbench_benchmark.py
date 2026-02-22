import fast_rlm
from datasets import load_dataset

ds = load_dataset("THUDM/LongBench",
                  "narrativeqa",
                  split="test",
                  trust_remote_code=True)
# idx = 100
idx = 140

example = ds[idx]

query = f"""
{example['input']}

{example['context']}
"""

data = fast_rlm.run(query, prefix=f"longbench_hotpot_idx{idx}")
print("Expected answer: ", example['answers'])
