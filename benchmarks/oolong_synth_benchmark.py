import fast_rlm
from datasets import load_dataset

ds = load_dataset("oolongbench/oolong-synth",
                  split="test")
# idx = 100
idx = 100

# tasks = ['timeline', 'user', 'counting']
#
# ds = ds.filter(lambda x: x['task_group'] == 'timeline')
example = ds[idx]
print(example['answer'])

query = f"""
{example['context_window_text_with_labels']}

{example['question']}
"""

data = fast_rlm.run(query, prefix=f"oolong_synth_idx{idx}")
print("Expected answer: ", example['answer'])
